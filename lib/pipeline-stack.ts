import * as cdk from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const name = 'Pipeline';
    const pipeline = new Pipeline(this, name, {
      pipelineName: name,
      crossAccountKeys: false,
    });

    const cdkSourceOutput = new Artifact('CdkSourceOutput');
    const serviceSourceOutput = new Artifact('ServiceSourceOutput');

    pipeline.addStage({
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

    const cdkBuildOutput = new Artifact('CdkBuildOutput');
    const serviceBuildOutput = new Artifact('ServiceBuildOutput');
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CDK_Build',
          input: cdkSourceOutput,
          outputs: [
            cdkBuildOutput
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
            serviceBuildOutput
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

    pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Pipeline_Update',
          stackName: 'PipelineStack',
          templatePath: cdkBuildOutput.atPath('PipelineStack.template.json'),
          adminPermissions: true,
        })
      ]
    })
  }
}
