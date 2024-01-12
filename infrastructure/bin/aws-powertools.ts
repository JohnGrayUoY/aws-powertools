#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsPowertoolsStack } from '../lib/aws-powertools-stack';

const app = new cdk.App();
new AwsPowertoolsStack(app, 'AwsPowertoolsStack', {});
