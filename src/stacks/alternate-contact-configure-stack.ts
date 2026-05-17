import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { AlternateContactConfigurer } from '../constructs/alternate-contact-configurer';

/** Properties for {@link AlternateContactConfigureStack}. */
export interface AlternateContactConfigureStackProps extends StackProps {
  /**
   * AWS region where Control Tower emits `CreateManagedAccount` events (Control Tower home region).
   * @default 'us-east-1'
   */
  readonly controlTowerHomeRegion?: string;
}

/**
 * CDK stack that instantiates {@link AlternateContactConfigurer} in the management account.
 *
 * Deploy this stack in the Control Tower home region (typically `us-east-1`) so EventBridge
 * receives account-creation events.
 */
export class AlternateContactConfigureStack extends Stack {
  /**
   * @param scope - Parent app or stage
   * @param id - Stack identifier
   * @param props - Stack and construct props (including optional home region)
   */
  constructor(scope: Construct, id: string, props: AlternateContactConfigureStackProps) {
    super(scope, id, props);

    new AlternateContactConfigurer(this, 'AlternateContactConfigurer', {
      controlTowerHomeRegion: props.controlTowerHomeRegion,
    });
  }
}
