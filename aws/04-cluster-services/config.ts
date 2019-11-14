import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"
const identityStackRef = new pulumi.StackReference(pulumiConfig.require("identityStackRef"));
const clusterStackRef = new pulumi.StackReference(pulumiConfig.require("clusterStackRef"));

export const config = {
    // Identity
    stdNodegroupIamRoleArn : identityStackRef.getOutput("stdNodegroupIamRoleArn"),
    perfNodegroupIamRoleArn: identityStackRef.getOutput("perfNodegroupIamRoleArn"),

    // Cluster
    kubeconfig: clusterStackRef.getOutput("kubeconfig"),
    clusterName: clusterStackRef.getOutput("clusterName"),
    clusterSvcsNamespaceName: clusterStackRef.getOutput("clusterSvcsNamespaceName"),
    appSvcsNamespaceName: clusterStackRef.getOutput("appSvcsNamespaceName"),
    appsNamespaceName: clusterStackRef.getOutput("appsNamespaceName"),
};
