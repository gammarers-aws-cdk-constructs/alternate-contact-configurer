# Alternate Contact Configurer (AWS CDK v2)

[![npm version](https://img.shields.io/npm/v/alternate-contact-configurer.svg)](https://www.npmjs.com/package/alternate-contact-configurer)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

AWS CDK construct library that automatically sets **alternate contacts** (Security, Billing, Operations) on new member accounts when AWS Control Tower finishes creating them via Account Factory.

Addresses Security Hub control **Account.1** (`Security contact information should be provided for an AWS account`) for accounts provisioned after deployment.

## Features

- **Event-driven automation** — EventBridge rule on Control Tower `CreateManagedAccount` events with `state: SUCCEEDED`
- **Lambda (Node.js 24)** — Loads twelve contact fields from SSM Parameter Store and calls `account:PutAlternateContact` for SECURITY, BILLING, and OPERATIONS in parallel
- **SSM-backed configuration** — Contact data is not hard-coded; parameters under `/org/alternate-contacts/*` must exist before deploy (not created by this library)
- **Control Tower home region** — Designed for deployment in the management account region where Control Tower emits events (typically `us-east-1`)
- **Ready-made stack** — `AlternateContactConfigureStack` or embed `AlternateContactConfigurer` in your own stack
- **Structured logging & tracing** — JSON application logs and AWS X-Ray tracing on the configure Lambda

## Installation

```bash
npm install alternate-contact-configurer
```

```bash
yarn add alternate-contact-configurer
```

`constructs` and `aws-cdk-lib` are peer dependencies and must be installed in your CDK app.

## Usage

### Using the stack

```typescript
import { App } from 'aws-cdk-lib';
import { AlternateContactConfigureStack } from 'alternate-contact-configurer';

const app = new App();

new AlternateContactConfigureStack(app, 'AlternateContactConfigureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1', // Control Tower home region
  },
  controlTowerHomeRegion: 'us-east-1',
});

app.synth();
```

### Using the construct

```typescript
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AlternateContactConfigurer } from 'alternate-contact-configurer';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, { env: { region: 'us-east-1' } });

    new AlternateContactConfigurer(this, 'AlternateContactConfigurer', {
      controlTowerHomeRegion: 'us-east-1',
    });
  }
}
```

### SSM parameters (prerequisite)

Create these parameters in the **management account** before deploying (example values):

| Purpose | Parameter path |
|--------|----------------|
| Security name / title / email / phone | `/org/alternate-contacts/security/{name,title,email,phone}` |
| Billing name / title / email / phone | `/org/alternate-contacts/billing/{name,title,email,phone}` |
| Operations name / title / email / phone | `/org/alternate-contacts/operations/{name,title,email,phone}` |

The Lambda reads `SSM_PATH_PREFIX` (default `/org/alternate-contacts`) plus `/security|billing|operations/{name,title,email,phone}`.

## Options

### `AlternateContactConfigurer` / `AlternateContactConfigureStack`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `controlTowerHomeRegion` | `string` | `'us-east-1'` | Region where Control Tower publishes `CreateManagedAccount` events. Deploy the stack in this region. A CDK warning is emitted if the stack region is known and does not match. |

`AlternateContactConfigureStack` also accepts standard `StackProps` (e.g. `env`, `tags`, `description`).

## Requirements

- **Node.js** `>= 20`
- **AWS CDK** `aws-cdk-lib` `^2.232.0` and **constructs** `^10.5.1`
- **AWS Control Tower** with Account Factory (or equivalent `CreateManagedAccount` events in the home region)
- **SSM parameters** — twelve String parameters under `/org/alternate-contacts` (see above)
- **Deploy region** — Control Tower **home region** (often `us-east-1`); events are not delivered to other regions for this rule

## License

This project is licensed under the Apache-2.0 License.
