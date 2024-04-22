import { CfnBudget } from 'aws-cdk-lib/aws-budgets';
import { Construct } from 'constructs';

interface budgetProps {
  budgetAmount: number,
  emailAddress: string,
}

export class Budget extends Construct {
  constructor(scope: Construct, id: string, props: budgetProps) {
    super(scope, id);

    new CfnBudget(this, 'Budget', {
      budget: {
        budgetLimit: {
          amount: props.budgetAmount,
          unit: 'USD'
        },
        budgetName: 'Monthly',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
      },
      notificationsWithSubscribers: [
        {
          notification: {
            threshold: 100,
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'EMAIL',
            address: props.emailAddress
          }],
        }
      ]
    });
  }
}