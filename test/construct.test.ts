import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AlternateContactConfigurer } from '../src';

describe('alternate contact configurer', () => {

  const app = new App();
  const stack = new Stack(app, 'TestingStack');

  new AlternateContactConfigurer(stack, 'AlternateContactConfigurer', {
    controlTowerHomeRegion: 'us-east-1',
  });

  const template = Template.fromStack(stack);
  it('Should match snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });
});
