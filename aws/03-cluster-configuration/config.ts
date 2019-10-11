import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"
const identityStackRef = new pulumi.StackReference(pulumiConfig.require("identityStackRef"));
const infraStackRef = new pulumi.StackReference(pulumiConfig.require("infraStackRef"));

export const config = {
    // Identity
    adminsIamRoleArn: identityStackRef.getOutput("adminsIamRoleArn"),
    devsIamRoleArn         : identityStackRef.getOutput("devsIamRoleArn"),
    stdNodegroupIamRoleArn : identityStackRef.getOutput("stdNodegroupIamRoleArn"),
    perfNodegroupIamRoleArn: identityStackRef.getOutput("perfNodegroupIamRoleArn"),

    // Infrastructure / Networking
    vpcId: infraStackRef.getOutput("vpcId"),
    publicSubnetIds: infraStackRef.getOutput("publicSubnetIds"),
    privateSubnetIds: infraStackRef.getOutput("privateSubnetIds"),

    /*
    defaultVpcId: infraStackRef.getOutput("defaultVpcId"),
    defaultPublicSubnetIds: infraStackRef.getOutput("defaultPublicSubnetIds"),
    defaultPrivateSubnetIds: infraStackRef.getOutput("defaultPrivateSubnetIds"),
    */

    /*
    existingVpcId: infraStackRef.getOutput("existingVpcId"),
    existingPublicSubnetIds: infraStackRef.getOutput("existingPublicSubnetIds"),
    existingPrivateSubnetIds: infraStackRef.getOutput("existingPrivateSubnetIds"),
    */
};
