import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"
const infraStackRef = new pulumi.StackReference(pulumiConfig.require("infraStackRef"));
const clusterStackRef = new pulumi.StackReference(pulumiConfig.require("clusterStackRef"));

export const config = {
    // Infra
    privateSubnetIds: infraStackRef.getOutput("privateSubnetIds"),
    publicSubnetIds: infraStackRef.getOutput("publicSubnetIds"),

    // Cluster
    kubeconfig: clusterStackRef.getOutput("kubeconfig"),
    clusterName: clusterStackRef.getOutput("clusterName"),
    securityGroupIds: clusterStackRef.getOutput("securityGroupIds"),
    clusterSvcsNamespaceName: clusterStackRef.getOutput("clusterSvcsNamespaceName"),
    appSvcsNamespaceName: clusterStackRef.getOutput("appSvcsNamespaceName"),
    appsNamespaceName: clusterStackRef.getOutput("appsNamespaceName"),

    // Misc
    databaseUsername: "admin",
    databasePassword: "supersecurepassword123",
};
