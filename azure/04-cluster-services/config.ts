import * as pulumi from "@pulumi/pulumi";

const pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"
const infraStackRef = new pulumi.StackReference(pulumiConfig.require("infraStackRef"));
const clusterStackRef = new pulumi.StackReference(pulumiConfig.require("clusterStackRef"));

export const config = {
    // Infrastructure
    logAnalyticsWorkspaceId:  infraStackRef.getOutput("logAnalyticsWorkspaceId"),

    // AKS Cluster
    clusterId:                clusterStackRef.getOutput("clusterId"),
    kubeconfig:               clusterStackRef.getOutput("kubeconfig"),
};
