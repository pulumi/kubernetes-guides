import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();

const infrastructureStackName = config.require("infrastructureStackName");
const infrastructureStack = new pulumi.StackReference(infrastructureStackName);

export const k8sProvider = new k8s.Provider(`${infrastructureStackName}`, {
    kubeconfig: infrastructureStack.getOutput("kubeconfig")
});
