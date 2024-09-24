#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CustomSqlserverStack } from '../lib/custom-sqlserver-stack';

const app = new cdk.App();

new CustomSqlserverStack(app, 'CustomSqlserverStack', {
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
