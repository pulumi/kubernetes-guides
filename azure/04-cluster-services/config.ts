import * as pulumi from "@pulumi/pulumi";

const pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"

const identityStackRef = new pulumi.StackReference(pulumiConfig.require("identityStackRef"));
const infraStackRef = new pulumi.StackReference(pulumiConfig.require("infraStackRef"));
const clusterStackRef = new pulumi.StackReference(pulumiConfig.require("clusterStackRef"));

export const config = {
    // Resource Group
    resourceGroupName:        identityStackRef.getOutput("resourceGroupName"),

    // Identity
    adApplicationId:          identityStackRef.getOutput("adApplicationId"),
    adSpPassword:             identityStackRef.getOutput("adSpPassword"),

    // Infrastructure / Networking
    subnetId:                 infraStackRef.getOutput("subnetId"),
    logAnalyticsWorkspaceId:  infraStackRef.getOutput("logAnalyticsWorkspaceId"),

    // AKS Cluster
    clusterId:                clusterStackRef.getOutput("clusterId"),
    kubeconfig:               clusterStackRef.getOutput("kubeconfig"),
};
