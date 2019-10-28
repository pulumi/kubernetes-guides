import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"
const infraStackRef = new pulumi.StackReference(pulumiConfig.require("infraStackRef"));
const clusterStackRef = new pulumi.StackReference(pulumiConfig.require("clusterStackRef"));

export const config = {
    project: infraStackRef.requireOutput("project"),

    // Cluster
    kubeconfig: clusterStackRef.requireOutput("kubeconfig"),
    clusterName: clusterStackRef.getOutput("clusterName"),
    appSvcsNamespaceName: clusterStackRef.getOutput("appSvcsNamespaceName"),
    appsNamespaceName: clusterStackRef.getOutput("appsNamespaceName"),
};
