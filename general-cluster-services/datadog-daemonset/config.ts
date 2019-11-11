import * as pulumi from "@pulumi/pulumi";

let pulumiConfig = new pulumi.Config();

// Existing Pulumi stack reference in the format:
// <organization>/<project>/<stack> e.g. "myUser/myProject/dev"
const clusterStackRef = new pulumi.StackReference(pulumiConfig.require("clusterStackRef"));

export const config = {
    // Cluster
    kubeconfig: clusterStackRef.getOutput("kubeconfig"),
    clusterSvcsNamespaceName: clusterStackRef.getOutput("clusterSvcsNamespaceName"),
    appSvcsNamespaceName: clusterStackRef.getOutput("appSvcsNamespaceName"),
    appsNamespaceName: clusterStackRef.getOutput("appsNamespaceName"),

    // Misc
    datadogApiKey: pulumiConfig.require("datadogApiKey"),
};
