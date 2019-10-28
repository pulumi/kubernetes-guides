import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

const infraStackRef = new pulumi.StackReference(pulumiConfig.require("infraStackRef"));

export const config = {
    networkName: infraStackRef.requireOutput("networkName"),
    subnetworkName: infraStackRef.requireOutput("subnetworkName"),
};
