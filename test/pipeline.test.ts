import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Pipeline from '../lib/pipeline-stack';
import { ServiceStack } from '../lib/stacks/service-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import {
  expect as expectCDK,
  haveResourceLike,
  arrayWith,
  objectLike,
} from '@aws-cdk/assert';
import { BillingStack } from '../lib/stacks/billing-stack';

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

test("Adding service stage", () => {
  // GIVEN
  const app = new cdk.App();
  const serviceStack = new ServiceStack(app, "ServiceStack");
  const pipelineStack = new PipelineStack(app, "PipelineStack");

  // WHEN
  pipelineStack.addServiceStage(serviceStack, "Test");

  // THEN
  expectCDK(pipelineStack).to(
    haveResourceLike("AWS::CodePipeline::Pipeline", {
      Stages: arrayWith(
        objectLike({
          Name: "Test",
        })
      ),
    })
  );
});

test("Adding billing stack to a stage", () => {
  // GIVEN
  const app = new cdk.App();
  const serviceStack = new ServiceStack(app, "ServiceStack");
  const pipelineStack = new PipelineStack(app, "PipelineStack");
  const billingStack = new BillingStack(app, "BillingStack", {
    budgetAmount: 5,
    emailAddress: "test@example.com",
  });
  const testStage = pipelineStack.addServiceStage(serviceStack, "Test");

  // WHEN
  pipelineStack.addBillingStackToStage(billingStack, testStage);

  // THEN
  expectCDK(pipelineStack).to(
    haveResourceLike("AWS::CodePipeline::Pipeline", {
      Stages: arrayWith(
        objectLike({
          Actions: arrayWith(
            objectLike({
              Name: "Billing_Update",
            })
          ),
        })
      ),
    })
  );
});

