import { Stack, StackProps } from 'aws-cdk-lib';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { CfnParametersCode, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Construct } from 'constructs';

interface ServiceStackProps extends StackProps {
  stageName: string;
}

export class ServiceStack extends Stack {
  public readonly serviceCode: CfnParametersCode;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    this.serviceCode = Code.fromCfnParameters();

    const lambda = new Function(this, 'ServiceLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'src/lambda.handler',
      code: this.serviceCode,
      functionName: `ServiceLambda${props.stackName}`
    });

    new HttpApi(this, 'ServiceApi', {
      defaultIntegration: new HttpLambdaIntegration('HttpLambdaIntegration', lambda),
      apiName: `MyService${props.stackName}`
    });
  }
}