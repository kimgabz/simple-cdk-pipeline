import { App, Stack } from "aws-cdk-lib";
import { Template } from 'aws-cdk-lib/assertions';
import { BillingStack } from "../../lib/stacks/billing-stack";


test('Billing Stack', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const budgetStack = new BillingStack(stack, 'Billing', {
    budgetAmount: 2,
    emailAddress: 'Test@example.com',
  });
  const template = Template.fromStack(budgetStack);

  template.hasResourceProperties('AWS::Budgets::Budget', {
    Budget: {
      BudgetLimit: {
        Amount: 2
      }
    },
    NotificationsWithSubscribers: [
      {
        Subscribers: [
          {
            Address: 'Test@example.com',
            // SubscriptionType: "EMAIL"
          }
        ]
      }
    ]
  });

  // Assert the template matches the snapshot.
  expect(template.toJSON()).toMatchSnapshot();
});