import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';


export class CustomSqlserverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
      restrictDefaultSecurityGroup: false,
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
      ipAddresses: ec2.IpAddresses.cidr('10.64.0.0/16')
    });

    // Create a security group for the RDS instance
    const securityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Allow SQL Server traffic',
      allowAllOutbound: true,
    });

    // securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(1433), 'Allow SQL Server access');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3389), 'Allow RDP access');

    const kmsKey = new kms.Key(this, 'KMSKey', {
      alias: 'AWSRDSCustomSQLServerKey',
      // Allow same account to use the key
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: [
              'kms:*',
            ],
            resources: ['*'],
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
          }),
        ],
      }),
    });

    const serviceRole = new iam.Role(this, 'AWSRDSCustomSQLServerInstanceServiceRole', {
      roleName: 'AWSRDSCustomSQLServerInstanceServiceRole',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSCustomInstanceProfileRolePolicy'),
      ],
    });

    const instanceProfile = new iam.CfnInstanceProfile(this, 'RDSCustomSQLServerInstanceProfile', {
      roles: [serviceRole.roleName],
      instanceProfileName: `AWSRDSCustomSQLServerInstanceProfile`,
    });

    const subnetGroup = new rds.CfnDBSubnetGroup(this, 'RDSSubnetGroup', {
      dbSubnetGroupDescription: 'Subnet group for RDS',
      subnetIds: vpc.publicSubnets.map(subnet => subnet.subnetId),
    });
  }
}
