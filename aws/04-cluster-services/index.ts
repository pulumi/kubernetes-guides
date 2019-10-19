import * as aws from "@pulumi/aws";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { config } from "./config";

const projectName = pulumi.getProject();

export const stdNodegroupIamRoleArn = config.stdNodegroupIamRoleArn
export const perfNodegroupIamRoleArn = config.perfNodegroupIamRoleArn
const stdNodegroupIamRoleName = stdNodegroupIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
const perfNodegroupIamRoleName = perfNodegroupIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
export const clusterName = config.clusterName

// Create a new IAM Policy for fluentd-cloudwatch to manage CloudWatch Logs.
const name = "fluentd-cloudwatch";
const fluentdCloudWatchPolicy = new aws.iam.Policy(name,
    {
        description: "Allows fluentd-cloudwatch to work with CloudWatch Logs.",
        policy: JSON.stringify(
            {
                Version: "2012-10-17",
                Statement: [{Effect: "Allow", Action: ["logs:*"], Resource: ["arn:aws:logs:*:*:*"]}]
            }
        )
    },
);

// Attach CloudWatch Logs policies to a role.
function attachLogPolicies(name: string, arn: pulumi.Input<aws.ARN>) {
    new aws.iam.RolePolicyAttachment(name,
        { policyArn: fluentdCloudWatchPolicy.arn, role: arn},
    );
}

attachLogPolicies("stdRpa", stdNodegroupIamRoleName);
attachLogPolicies("perfRpa", perfNodegroupIamRoleName);

// Deploy fluentd using the Helm chart.
const eksProvider = new k8s.Provider("eksProvider", {kubeconfig: config.kubeconfig.apply(JSON.stringify)});
const fluentdCloudWatchLogGroup = new aws.cloudwatch.LogGroup(name);
export let fluentdCloudWatchLogGroupName = fluentdCloudWatchLogGroup.name;
const fluentdCloudwatch = new k8s.helm.v2.Chart(name,
    {
        namespace: config.clusterSvcsNamespaceName,
        chart: "fluentd-cloudwatch",
        version: "0.11.0",
        fetchOpts: {
            repo: "https://kubernetes-charts-incubator.storage.googleapis.com/",
        },
        values: {
            extraVars: [ "{ name: FLUENT_UID, value: '0' }" ],
            rbac: {create: true},
            awsRegion: aws.config.region,
            logGroupName: fluentdCloudWatchLogGroup.name,
        },
        transformations: [
            (obj: any) => {
                // Do transformations on the YAML to set the namespace
                if (obj.metadata) {
                    obj.metadata.namespace = config.clusterSvcsNamespaceName;
                }
            },
        ],
    },
    {providers: { kubernetes: eksProvider }},
);
