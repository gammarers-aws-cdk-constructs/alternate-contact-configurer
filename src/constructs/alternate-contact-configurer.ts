import { Annotations, Duration, Stack } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction as LambdaFunctionTarget } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Token } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

import { ContactsConfigurerFunction } from '../funcs/contacts-configurer-function';

/** Properties for {@link AlternateContactConfigurer}. */
export interface AlternateContactConfigurerProps {
  /**
   * AWS region where Control Tower emits `CreateManagedAccount` events (Control Tower home region).
   * @default 'us-east-1'
   */
  readonly controlTowerHomeRegion?: string;
}

/**
 * CDK construct that wires an EventBridge rule on successful Control Tower account creation
 * to a Lambda which reads alternate contact data from SSM and calls `PutAlternateContact`.
 *
 * Deploy this stack only in the Control Tower home region so the rule receives events.
 */
export class AlternateContactConfigurer extends Construct {
  /**
   * @param scope - Parent construct, typically a `Stack`
   * @param id - Construct ID
   * @param props - Optional home region override
   */
  public constructor(scope: Construct, id: string, props: AlternateContactConfigurerProps = {}) {
    super(scope, id);
    const controlTowerHomeRegion = this.getControlTowerHomeRegion(props);
    this.validateDeploymentRegion(controlTowerHomeRegion);
    const lambdaFunction = new ContactsConfigurerFunction(this, 'ConfigureAlternateContacts', {
      timeout: Duration.minutes(2),
      environment: {
        SSM_PATH_PREFIX: '/org/alternate-contacts',
      },
      tracing: lambda.Tracing.ACTIVE,
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.INFO,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
    });
    lambdaFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['account:PutAlternateContact'],
        resources: ['arn:aws:organizations::*:account/o-*/*'],
      }),
    );
    lambdaFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParameters'],
        resources: ['arn:aws:ssm:*:*:parameter/org/alternate-contacts/*'],
      }),
    );
    lambdaFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      }),
    );
    const rule = new Rule(this, 'CreateManagedAccountSucceededRule', {
      description: 'Configure alternate contacts when Control Tower successfully creates a managed account',
      eventPattern: {
        source: ['aws.controltower'],
        detailType: ['AWS Service Event via CloudTrail'],
        detail: {
          eventName: ['CreateManagedAccount'],
          serviceEventDetails: {
            createManagedAccountStatus: {
              state: ['SUCCEEDED'],
            },
          },
        },
      },
    });
    rule.addTarget(new LambdaFunctionTarget(lambdaFunction));
  }

  /**
   * @param props - User props; falls back to `us-east-1`
   * @returns Region string used for deployment validation messaging
   */
  private getControlTowerHomeRegion(props: AlternateContactConfigurerProps): string {
    return props.controlTowerHomeRegion ?? 'us-east-1';
  }

  /**
   * Emits a CDK warning when the stack region is known and differs from the expected home region.
   *
   * @param expectedRegion - Region passed from props (default `us-east-1`)
   */
  private validateDeploymentRegion(expectedRegion: string): void {
    const stack = Stack.of(this);
    const stackRegion = stack.region;
    if (!Token.isUnresolved(stackRegion) && stackRegion !== expectedRegion) {
      Annotations.of(this).addWarningV2(
        'AlternateContactConfigurer:wrongRegion',
        `AlternateContactConfigurer must be deployed in the Control Tower home region (${expectedRegion}). ` +
          'CreateManagedAccount events are only emitted there.',
      );
    }
  }
}
