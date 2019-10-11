import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as iam from "./iam";
import * as utils from "./utils";

const projectName = pulumi.getProject();

// Export VPC ID and Subnets.
export const vpcId = vpc.id;
export const allVpcSubnets = vpc.privateSubnetIds.concat(vpc.publicSubnetIds);

// Create 3 IAM Roles and matching InstanceProfiles to use with the nodegroups.
const roles = iam.createRoles(projectName, 3);
const instanceProfiles = iam.createInstanceProfiles(projectName, roles);

// Create an EKS cluster.
const myCluster = new eks.Cluster(`${projectName}`, {
    version: "1.14",
    vpcId: vpcId,
    subnetIds: allVpcSubnets,
    nodeAssociatePublicIpAddress: false,
    skipDefaultNodeGroup: true,
    deployDashboard: false,
    instanceRoles: roles,
    enabledClusterLogTypes: ["api", "audit", "authenticator",
        "controllerManager", "scheduler"],
});
export const kubeconfig = myCluster.kubeconfig;
export const clusterName = myCluster.core.cluster.name;

// Create a Standard node group of t2.medium workers.
const ngStandard = utils.createNodeGroup(`${projectName}-ng-standard`, {
    ami: "ami-03a55127c613349a7", // k8s v1.13.7 in us-west-2
    instanceType: "t2.medium",
    desiredCapacity: 3,
    cluster: myCluster,
    instanceProfile: instanceProfiles[0],
});

// Create a 2xlarge node group of t3.2xlarge workers with taints on the nodes
// dedicated for the NGINX Ingress Controller.
const ng2xlarge = utils.createNodeGroup(`${projectName}-ng-2xlarge`, {
    ami: "ami-0355c210cb3f58aa2", // k8s v1.12.7 in us-west-2
    instanceType: "t3.2xlarge",
    desiredCapacity: 3,
    cluster: myCluster,
    instanceProfile: instanceProfiles[1],
    taints: {"nginx": { value: "true", effect: "NoSchedule"}},
});

// Create a Kubernetes namespace for apps.
const namespace = new k8s.core.v1.Namespace("apps", undefined, { provider: myCluster.provider });
export const namespaceName = namespace.metadata.name;
