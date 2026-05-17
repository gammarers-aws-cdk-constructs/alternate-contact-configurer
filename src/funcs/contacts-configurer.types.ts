/**
 * Base error for Lambda-side failures.
 * Does not extend native `Error` due to JSII constraints in the parent construct library.
 */
export class BaseError {
  /** Error name (subclass name). */
  public readonly name: string;
  /**
   * @param message - Human-readable message
   * @param cause - Optional underlying cause
   */
  public constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {
    this.name = new.target.name;
  }
}

/** AWS account alternate contact kinds applied by this Lambda. */
export type AlternateContactType = 'SECURITY' | 'BILLING' | 'OPERATIONS';

/** Contact fields read from SSM and sent to Account Management API. */
export interface ContactInfo {
  readonly name: string;
  readonly title: string;
  readonly email: string;
  readonly phone: string;
}

/** Outcome of a single {@link AlternateContactType} update for one account. */
export interface AlternateContactResult {
  readonly type: AlternateContactType;
  readonly accountId: string;
  readonly success: boolean;
  /** Present when `success` is false. */
  readonly error?: string;
}

/** Thrown when configuration cannot be completed (e.g. all PutAlternateContact calls failed). */
export class AlternateContactConfigureError extends BaseError {}

/**
 * `detail` payload for Control Tower `CreateManagedAccount` service events delivered via EventBridge
 * (AWS service events through CloudTrail).
 */
export interface CreateManagedAccountEventDetail {
  readonly eventName: string;
  readonly serviceEventDetails: {
    readonly createManagedAccountStatus: {
      readonly account: {
        readonly accountId: string;
        readonly accountName: string;
      };
      readonly state: 'SUCCEEDED' | 'FAILED';
    };
  };
}
