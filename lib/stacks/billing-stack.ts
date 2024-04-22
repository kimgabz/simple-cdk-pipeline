import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Budget } from '../constructs/budget';

interface billingStackProps extends cdk.StackProps {
  budgetAmount: number,
  emailAddress: string,
}

export class BillingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: billingStackProps) {
    super(scope, id, props);

    new Budget(this, 'Budget', {
      budgetAmount: props.budgetAmount,
      emailAddress: props.emailAddress
    });


  }
}