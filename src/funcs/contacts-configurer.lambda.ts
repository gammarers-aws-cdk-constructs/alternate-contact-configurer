/**
 * Lambda entry: applies organization alternate contacts when Control Tower finishes account creation.
 *
 * Expects SSM parameters under the prefix from `SSM_PATH_PREFIX` (default `/org/alternate-contacts`).
 * @module contacts-configurer
 */
import { AccountClient, PutAlternateContactCommand } from '@aws-sdk/client-account';
import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';
import type { Context, EventBridgeHandler } from 'aws-lambda';

import {
  AlternateContactConfigureError,
  AlternateContactResult,
  AlternateContactType,
  ContactInfo,
  CreateManagedAccountEventDetail,
} from './contacts-configurer.types';

/** Default SSM path prefix when `SSM_PATH_PREFIX` is unset. */
const DEFAULT_SSM_PREFIX = '/org/alternate-contacts';

/** Maximum parameter names per `GetParameters` request (AWS API limit). */
const PARAMETER_BATCH_SIZE = 10;

/** Resolves effective SSM prefix from environment or default. */
const getSsmPathPrefix = (): string => process.env.SSM_PATH_PREFIX ?? DEFAULT_SSM_PREFIX;

/**
 * Builds the ordered list of twelve SSM parameter names (security, billing, operations × four fields).
 *
 * @param prefix - Root path without trailing slash (e.g. `/org/alternate-contacts`)
 * @returns Fully qualified parameter names for `GetParameters`
 */
const getParameterNames = (prefix: string): string[] => {
  const categories = ['security', 'billing', 'operations'] as const;
  const fields = ['name', 'title', 'email', 'phone'] as const;
  const names: string[] = [];
  for (const category of categories) {
    for (const field of fields) {
      names.push(`${prefix}/${category}/${field}`);
    }
  }
  return names;
};

/**
 * Loads SSM parameters in fixed-size batches until all requested names are read.
 *
 * @param ssm - SSM client
 * @param names - Full ordered list of parameter names (length known upfront)
 * @returns Map of parameter name to decrypted string value
 * @throws AlternateContactConfigureError when the API reports invalid parameter names
 */
const getParametersByNames = async (ssm: SSMClient, names: string[]): Promise<Map<string, string>> => {
  const result = new Map<string, string>();
  const hasMoreBatches = (offset: number): boolean => offset < names.length;
  let offset = 0;
  while (hasMoreBatches(offset)) {
    const chunk = names.slice(offset, offset + PARAMETER_BATCH_SIZE);
    offset += PARAMETER_BATCH_SIZE;
    const response = await ssm.send(
      new GetParametersCommand({
        Names: chunk,
        WithDecryption: true,
      }),
    );
    if (response.InvalidParameters && response.InvalidParameters.length > 0) {
      console.error('Invalid SSM parameters:', response.InvalidParameters);
      throw new AlternateContactConfigureError(
        `SSM GetParameters failed: invalid or missing parameters: ${response.InvalidParameters.join(', ')}`,
      );
    }
    for (const parameter of response.Parameters ?? []) {
      if (parameter.Name === undefined || parameter.Value === undefined) {
        continue;
      }
      result.set(parameter.Name, parameter.Value);
    }
  }
  return result;
};

/**
 * Reads four SSM-backed fields for one logical category (e.g. `security`).
 *
 * @param parameters - Values keyed by full parameter name
 * @param prefix - Same prefix as {@link getParameterNames}
 * @param category - Subfolder under prefix (`security` | `billing` | `operations`)
 * @returns Structured contact fields
 * @throws AlternateContactConfigureError if any required key is missing
 */
const getContactInfo = (parameters: Map<string, string>, prefix: string, category: string): ContactInfo => {
  const getValue = (field: string): string => {
    const key = `${prefix}/${category}/${field}`;
    const value = parameters.get(key);
    if (!value) {
      throw new AlternateContactConfigureError(`Missing SSM parameter: ${key}`);
    }
    return value;
  };
  return {
    name: getValue('name'),
    title: getValue('title'),
    email: getValue('email'),
    phone: getValue('phone'),
  };
};

/**
 * Maps all three alternate contact types to SSM-backed {@link ContactInfo}.
 *
 * @param parameters - Values keyed by full parameter name
 * @param prefix - SSM root path prefix
 * @returns SECURITY, BILLING, and OPERATIONS contacts keyed by type
 */
const getSecurityBillingOperationsContacts = (
  parameters: Map<string, string>,
  prefix: string,
): Record<AlternateContactType, ContactInfo> => ({
  SECURITY: getContactInfo(parameters, prefix, 'security'),
  BILLING: getContactInfo(parameters, prefix, 'billing'),
  OPERATIONS: getContactInfo(parameters, prefix, 'operations'),
});

/**
 * Calls `PutAlternateContact` for one type; swallows API errors into a failed result for aggregation.
 *
 * @param client - Account Management API client
 * @param accountId - Target member account
 * @param type - Alternate contact type to set
 * @param contact - Fields to send (must not be logged in full to avoid leaking PII)
 * @returns Success flag and optional error message
 */
const putAlternateContactForType = async (
  client: AccountClient,
  accountId: string,
  type: AlternateContactType,
  contact: ContactInfo,
): Promise<AlternateContactResult> => {
  try {
    await client.send(
      new PutAlternateContactCommand({
        AccountId: accountId,
        AlternateContactType: type,
        EmailAddress: contact.email,
        Name: contact.name,
        PhoneNumber: contact.phone,
        Title: contact.title,
      }),
    );
    return { type, accountId, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`PutAlternateContact failed for ${type} on account ${accountId}:`, message);
    return { type, accountId, success: false, error: message };
  }
};

/**
 * Produces a log-safe string for an unknown error (message only, no object dump).
 *
 * @param error - Any thrown value
 * @returns Non-empty diagnostic string safe for `console.error`
 */
const formatLogSafeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * EventBridge target handler: when Control Tower reports `CreateManagedAccount` success,
 * loads twelve SSM parameters and sets SECURITY, BILLING, and OPERATIONS alternate contacts.
 *
 * @param event - EventBridge event; `detail` is {@link CreateManagedAccountEventDetail}
 * @param context - Lambda runtime context (used for `awsRequestId` in logs only)
 * @throws When SSM parameter loading fails (error is logged then re-thrown), or when all
 *   `PutAlternateContact` calls fail ({@link AlternateContactConfigureError}).
 */
export const handler: EventBridgeHandler<
  'AWS Service Event via CloudTrail',
  CreateManagedAccountEventDetail,
  void
> = async (event, context: Context): Promise<void> => {
  const accountId = event.detail.serviceEventDetails.createManagedAccountStatus.account.accountId;
  const prefix = getSsmPathPrefix();
  const names = getParameterNames(prefix);
  const ssm = new SSMClient({});
  let parameters: Map<string, string>;
  try {
    parameters = await getParametersByNames(ssm, names);
  } catch (error) {
    console.error(
      'Failed to load alternate contact parameters from SSM:',
      formatLogSafeError(error),
      'requestId:',
      context.awsRequestId,
    );
    throw error;
  }
  const contacts = getSecurityBillingOperationsContacts(parameters, prefix);
  const accountClient = new AccountClient({});
  const types: AlternateContactType[] = ['SECURITY', 'BILLING', 'OPERATIONS'];
  const results = await Promise.all(
    types.map((type) => putAlternateContactForType(accountClient, accountId, type, contacts[type])),
  );
  const failures = results.filter((r) => !r.success);
  if (failures.length !== results.length) {
    console.log(
      JSON.stringify({
        message: 'Alternate contacts configured successfully',
        requestId: context.awsRequestId,
        accountId,
        results,
      }),
    );
    return;
  }
  const detail = failures.map((f) => `${f.type}: ${f.error ?? 'unknown error'}`).join('; ');
  throw new AlternateContactConfigureError(
    `All PutAlternateContact calls failed for account ${accountId}: ${detail}`,
  );
};
