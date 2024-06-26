#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import { BillingStack } from '../lib/stacks/billing-stack';
import { ServiceStack } from '../lib/stacks/service-stack';

const app = new cdk.App();
const pipelineStack = new PipelineStack(app, 'PipelineStack', {});
const billingStack = new BillingStack(app, 'BillingStack', {
  budgetAmount: 5,
  emailAddress: 'khemgabz@gmail.com'
});

const serviceStackTest = new ServiceStack(app, 'ServiceStackProd', {
  stageName: 'Test'
});

const serviceStackProd = new ServiceStack(app, 'ServiceStackProd', {
  stageName: 'Prod'
});

const testStage = pipelineStack.addServiceStage(serviceStackProd, 'Test');
const prodStage = pipelineStack.addServiceStage(serviceStackProd, 'Prod');
pipelineStack.addBillingStackToStage(billingStack, prodStage);