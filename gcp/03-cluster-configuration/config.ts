import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

const identityStackName = new pulumi.StackReference(pulumiConfig.require("identityStackName"));
const infraStackName = new pulumi.StackReference(pulumiConfig.require("infraStackName"));

export const config = {
    adminsIamServiceAccountSecret: identityStackName.requireOutput("adminsIamServiceAccountSecret"),
    devsIamServiceAccountSecret: identityStackName.requireOutput("devsIamServiceAccountSecret"),
    project: identityStackName.requireOutput("project"),
    adminsAccountId: identityStackName.requireOutput("adminsAccountId"),
    devsAccountId: identityStackName.requireOutput("devsAccountId"),
    networkName: infraStackName.requireOutput("networkName"),
    subnetworkName: infraStackName.requireOutput("subnetworkName"),
};
