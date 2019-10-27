import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";

const pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"

const identityStackRef = new pulumi.StackReference(pulumiConfig.require("identityStackRef"));
const infraStackRef = new pulumi.StackReference(pulumiConfig.require("infraStackRef"));

export const config = {
    // Resource Group
    resourceGroupName:        identityStackRef.getOutput("resourceGroupName"),

    // Identity
    adServerAppId:            identityStackRef.getOutput("adServerAppId"),
    adServerAppSecret:        identityStackRef.getOutput("adServerAppSecret"),
    adClientAppId:            identityStackRef.getOutput("adClientAppId"),
    adClientAppSecret:        identityStackRef.getOutput("adClientAppSecret"),
    adGroupDevs:              identityStackRef.getOutput("adGroupDevs"),

    // Infrastructure / Networking
    subnetId:                 infraStackRef.getOutput("subnetId"),
    logAnalyticsWorkspaceId:  infraStackRef.getOutput("logAnalyticsWorkspaceId"),
};
