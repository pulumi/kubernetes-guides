import * as pulumi from "@pulumi/pulumi";

const pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"

const identityStackRef = new pulumi.StackReference(pulumiConfig.require("identityStackRef"));

export const config = {
    // Resource Group
    resourceGroupName:      identityStackRef.getOutput("resourceGroupName"),

    // Identity
    adApplicationId:        identityStackRef.getOutput("adApplicationId"),
    adSpPassword:           identityStackRef.getOutput("adSpPassword"),
};
