import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AlternateContactConfigureStack } from '../src';

describe('AlternateContactConfigureStack', () => {

  const app = new App();
  const stack = new AlternateContactConfigureStack(app, 'AlternateContactConfigureStack', {
    controlTowerHomeRegion: 'us-east-1',
  });

  const template = Template.fromStack(stack);

  it('Should match snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('Should create Lambda, EventBridge rule, and IAM policies', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.resourceCountIs('AWS::Events::Rule', 1);
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        'source': ['aws.controltower'],
        'detail-type': ['AWS Service Event via CloudTrail'],
        'detail': {
          eventName: ['CreateManagedAccount'],
          serviceEventDetails: {
            createManagedAccountStatus: {
              state: ['SUCCEEDED'],
            },
          },
        },
      },
    });
  });
});
