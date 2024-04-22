import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Pipeline from '../lib/pipeline-stack';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/pipeline-stack.ts
test('Pipeline Stack Test', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Pipeline.PipelineStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);
  // Assert the template matches the snapshot.
  expect(template.toJSON()).toMatchSnapshot();
});
