import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import {
  Dashboard,
  GraphWidget,
  Metric,
  SingleValueWidget,
  Stats,
} from 'aws-cdk-lib/aws-cloudwatch';
import { LayerVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import {
  awsPowertoolsConfig,
  MetricNames,
  ServiceNames,
} from '../../lambdas/common/awsPowertoolsConfig';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';

export class AwsPowertoolsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new NodejsFunction(this, 'aws-powertools-logging', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'loggingHandler',
      entry: 'lambdas/logging/loggingHandler.ts',
      functionName: 'loggingHandler',
    });

    const tracingRole = new Role(this, 'tracing-role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    tracingRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      })
    );

    new NodejsFunction(this, 'aws-powertools-tracer', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'tracerHandler',
      entry: 'lambdas/tracer/tracerHandler.ts',
      functionName: 'tracerHandler',
      // Enable X-Ray tracing for this lambda.
      tracing: Tracing.ACTIVE,
      role: tracingRole,
    });

    //#region Metrics

    const lambdaInsightsRole = new Role(this, 'lambda-insights-role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaInsightsRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'CloudWatchLambdaInsightsExecutionRolePolicy'
      )
    );

    const lambdaInsightsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'LayerFromArn',
      'arn:aws:lambda:eu-west-1:580247275435:layer:LambdaInsightsExtension:38'
    );

    new NodejsFunction(this, 'aws-powertools-metrics', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'metricsHandler',
      entry: 'lambdas/metrics/metricsHandler.ts',
      functionName: 'metricsHandler',
      role: lambdaInsightsRole,
      layers: [lambdaInsightsLayer],
    });

    const testQueuePublish = new Queue(this, 'aws-powertools-dashboard-queue');

    const processedSingleValueWidget = new SingleValueWidget({
      title: 'Processed',
      width: 24,
      metrics: [
        new Metric({
          metricName: MetricNames.successes,
          namespace: awsPowertoolsConfig.namespace,
          period: Duration.days(7),
          statistic: Stats.SUM,
          region: 'eu-west-1',
          dimensionsMap: {
            service: ServiceNames.metricsTest,
          },
        }),
        new Metric({
          metricName: MetricNames.failures,
          namespace: awsPowertoolsConfig.namespace,
          period: Duration.days(7),
          statistic: Stats.SUM,
          region: 'eu-west-1',
          dimensionsMap: {
            service: ServiceNames.metricsTest,
          },
        }),
      ],
    });

    const sqsWidget = new SingleValueWidget({
      title: 'SQS',
      width: 12,
      metrics: [
        new Metric({
          ...testQueuePublish.metricApproximateNumberOfMessagesVisible(),
          metricName: 'Events in Publish DLQ',
          period: Duration.days(1),
        }),
      ],
    });

    const lambdaWidget = new GraphWidget({
      title: 'Lambda CPU',
      width: 12,
      left: [
        new Metric({
          metricName: 'cpu_total_time',
          namespace: 'LambdaInsights',
          period: Duration.days(7),
          statistic: Stats.AVERAGE,
          region: 'eu-west-1',
          dimensionsMap: {
            function_name: 'metricsHandler',
          },
        }),
      ],
    });

    const dashboard = new Dashboard(this, 'aws-powertools-dashboard', {
      defaultInterval: Duration.days(7),
      dashboardName: 'aws-powertools-dashboard',
    });

    dashboard.addWidgets(processedSingleValueWidget);
    dashboard.addWidgets(sqsWidget);
    dashboard.addWidgets(lambdaWidget);

    //#endregion
  }
}
