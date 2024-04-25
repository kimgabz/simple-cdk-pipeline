import * as cdk from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import {
  CloudFormationCreateUpdateStackAction,
  CodeBuildAction,
  GitHubSourceAction
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
import { ServiceStack } from './stacks/service-stack';
import { BillingStack } from './stacks/billing-stack';

export class PipelineStack extends cdk.Stack {
  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;
  private readonly serviceBuildOutput: Artifact;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const name = 'Pipeline';
    this.pipeline = new Pipeline(this, name, {
      pipelineName: name,
      crossAccountKeys: false,
      restartExecutionOnUpdate: true,
    });

    const cdkSourceOutput = new Artifact('CdkSourceOutput');
    const serviceSourceOutput = new Artifact('ServiceSourceOutput');

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: 'kimgabz',
          repo: 'simple-cdk-pipeline',
          branch: 'master',
          actionName: 'Pipeline_Source',
          oauthToken: cdk.SecretValue.secretsManager('github-pipelin-token'),
          output: cdkSourceOutput,
        }),
        new GitHubSourceAction({
          owner: 'kimgabz',
          repo: 'express_lambda_server',
          branch: 'master',
          actionName: 'Service_Source',
          oauthToken: cdk.SecretValue.secretsManager('github-pipelin-token'),
          output: serviceSourceOutput,
        })
      ]
    });

    this.cdkBuildOutput = new Artifact('CdkBuildOutput');
    this.serviceBuildOutput = new Artifact('ServiceBuildOutput');
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CDK_Build',
          input: cdkSourceOutput,
          outputs: [
            this.cdkBuildOutput
          ],
          project: new PipelineProject(this, 'CdkBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
          })
        }),
        new CodeBuildAction({
          actionName: 'Service_Build',
          input: serviceSourceOutput,
          outputs: [
            this.serviceBuildOutput
          ],
          project: new PipelineProject(this, 'ServiceBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')
          })
        }),
      ]
    });

    this.pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Pipeline_Update',
          stackName: 'PipelineStack',
          templatePath: this.cdkBuildOutput.atPath('PipelineStack.template.json'),
          adminPermissions: true,
        })
      ]
    })
  }

  public addServiceStage(serviceStack: ServiceStack, stageName: string) {
    return this.pipeline.addStage({
      stageName: stageName,
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Service_Update',
          stackName: serviceStack.stackName,
          templatePath: this.cdkBuildOutput.atPath(
            `${serviceStack.stackName}.template.json`
          ),
          adminPermissions: true,
          parameterOverrides: {
            ...serviceStack.serviceCode.assign(
              this.serviceBuildOutput.s3Location
            ),
          },
          extraInputs: [this.serviceBuildOutput],
        }),
      ],
    });
  }

  public addBillingStackToStage(billingStack: BillingStack, stage: IStage) {
    stage.addAction(
      new CloudFormationCreateUpdateStackAction({
        actionName: "Billing_Update",
        stackName: billingStack.stackName,
        templatePath: this.cdkBuildOutput.atPath(
          `${billingStack.stackName}.template.json`
        ),
        adminPermissions: true,
      })
    );
  }
}
