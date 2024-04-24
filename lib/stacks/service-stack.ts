import { Stack, StackProps } from "aws-cdk-lib";
import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Construct } from "constructs";


export class ServiceStack extends Stack {
  public readonly serviceCode: Code;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.serviceCode = Code.fromCfnParameters();

    const lambda = new Function(this, 'ServiceLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'src/lambda.handler',
      code: this.serviceCode,
      functionName: 'ServiceLambda'
    });

    new HttpApi(this, 'ServiceApi', {
      defaultIntegration: new HttpLambdaIntegration('HttpLambdaIntegration', lambda),
      apiName: 'MyService'
    });
  }
}