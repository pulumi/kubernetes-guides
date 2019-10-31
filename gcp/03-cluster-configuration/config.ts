import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

const infraStackName = new pulumi.StackReference(pulumiConfig.require("infraStackName"));

export const config = {
    networkName: infraStackName.requireOutput("networkName"),
    subnetworkName: infraStackName.requireOutput("subnetworkName"),
};
