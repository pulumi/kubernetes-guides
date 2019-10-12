import * as k8s from "@pulumi/kubernetes";
import * as azure from "@pulumi/azure";
import * as random from "@pulumi/random";
import * as tls from "@pulumi/tls";
import * as azuread from "@pulumi/azuread";
import * as pulumi from "@pulumi/pulumi";
import { config } from "./config";

const name = pulumi.getProject();

/*
export const adminsIamRoleArn = config.adminsIamRoleArn
export const devsIamRoleArn = config.devsIamRoleArn
export const stdNodegroupIamRoleArn = config.stdNodegroupIamRoleArn
export const perfNodegroupIamRoleArn = config.perfNodegroupIamRoleArn
const adminsIamRoleName = adminsIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
const devsIamRoleName = devsIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
const stdNodegroupIamRoleName = stdNodegroupIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
const perfNodegroupIamRoleName = perfNodegroupIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
*/

/* Identity */

// Generate a strong password for the Service Principal.
const password = new random.RandomString(`${name}-password`, {
    length: 20,
    special: true,
}, {additionalSecretOutputs: ["result"]}).result;

// Create the AD service principal for the K8s cluster.
const adApp = new azuread.Application(`${name}-aks`, undefined);
const adSp = new azuread.ServicePrincipal(`${name}-aksSp`, {
    applicationId: adApp.applicationId
});
const adSpPassword = new azuread.ServicePrincipalPassword(`${name}-aksSpPassword`, {
    servicePrincipalId: adSp.id,
    value: password,
    endDate: "2099-01-01T00:00:00Z",
});

const resourceGroup = new azure.core.ResourceGroup(`${name}`);

// Grant the resource group the "Network Contributor" role so that it
// can link the static IP to a Service LoadBalancer.
const rgNetworkRole = new azure.role.Assignment(`${name}-spRole`, {
    principalId: adSp.id,
    scope: resourceGroup.id,
    roleDefinitionName: "Network Contributor"
});

/* Networking */

// Create a Virtual Network for the cluster
const vnet = new azure.network.VirtualNetwork(`${name}`, {
    resourceGroupName: resourceGroup.name,
    addressSpaces: ["10.2.0.0/16"],
});

// Create a Subnet for the cluster
const subnet = new azure.network.Subnet(`${name}`, {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vnet.name,
    addressPrefix: "10.2.1.0/24",
});

/* Cluster */

// Create an SSH public key that will be used by the Kubernetes cluster.
// Note: We create one here to simplify the demo, but a production
// deployment would probably pass an existing key in as a variable.
const sshPublicKey = new tls.PrivateKey(`${name}-sshKey`, {
    algorithm: "RSA",
    rsaBits: 4096,
}).publicKeyOpenssh;

// Create the AKS cluster.
const cluster = new azure.containerservice.KubernetesCluster(`${name}`, {
    resourceGroupName: resourceGroup.name,
    agentPoolProfiles: [{
        name: "aksagentpool",
        count: 2,
        vmSize: "Standard_B2s",
        osType: "Linux",
        osDiskSizeGb: 30,
        vnetSubnetId: subnet.id,
    }],
    dnsPrefix: name,
    enablePodSecurityPolicy: true,
    linuxProfile: {
        adminUsername: "aksuser",
        sshKey: {
            keyData: sshPublicKey,
        },
    },
    servicePrincipal: {
        clientId: adApp.applicationId,
        clientSecret: adSpPassword.value,
    },
    kubernetesVersion: "1.14.6",
    roleBasedAccessControl: {enabled: true},
    networkProfile: {
        networkPlugin: "azure",
        dnsServiceIp: "10.2.2.254",
        serviceCidr: "10.2.2.0/24",
        dockerBridgeCidr: "172.17.0.1/16",
    },
});

// Expose a k8s provider instance of the cluster.
const provider = new k8s.Provider(`${name}-aks`, {
    kubeconfig: cluster.kubeConfigRaw,
});

// Create a static public IP for the Service LoadBalancer.
const staticAppIp = new azure.network.PublicIp(`${name}-staticAppIp`, {
    resourceGroupName: cluster.nodeResourceGroup,
    allocationMethod: "Static"
}).ipAddress;

// Export the cluster details.
export const kubeconfig = cluster.kubeConfigRaw;
export const clusterName = cluster.name;

// Create Kubernetes namespaces.
const clusterSvcsNamespace = new k8s.core.v1.Namespace("cluster-svcs", undefined, { provider: provider });
export const clusterSvcsNamespaceName = clusterSvcsNamespace.metadata.name;

const appSvcsNamespace = new k8s.core.v1.Namespace("app-svcs", undefined, { provider: provider });
export const appSvcsNamespaceName = appSvcsNamespace.metadata.name;

const appNamespace = new k8s.core.v1.Namespace("apps", undefined, { provider: provider });
export const appNamespaceName = appNamespace.metadata.name;

// Create a resource quota in the apps namespace.
const quotaAppNamespace = new k8s.core.v1.ResourceQuota("apps", {
    metadata: {namespace: appNamespaceName},
    spec: {
        hard: {
            cpu: "20",
            memory: "1Gi",
            pods: "10",
            replicationcontrollers: "20",
            resourcequotas: "1",
            services: "5",
        },
    }
},{
    provider: provider
});

// Create a limited role for the `pulumi:devs` to use in the apps namespace.
let devsGroupRole = new k8s.rbac.v1.Role("pulumi-devs",
    {
        metadata: {
            namespace: appNamespaceName,
        },
        rules: [
            {
                apiGroups: ["", "apps"],
                resources: ["pods", "services", "deployments", "replicasets", "persistentvolumeclaims"],
                verbs: ["get", "list", "watch", "create", "update", "delete"],
            },
        ],
    },
    {
        provider: provider,
    },
);

// Bind the `pulumi:devs` RBAC group to the new, limited role.
let devsGroupRoleBinding = new k8s.rbac.v1.RoleBinding("pulumi-devs", {
	metadata: {
		namespace: appNamespaceName,
	},
    subjects: [{
        kind: "Group",
        name: "pulumi:devs",
    }],
    roleRef: {
        kind: "Role",
        name: devsGroupRole.metadata.name,
        apiGroup: "rbac.authorization.k8s.io",
    },
}, {provider: provider});
