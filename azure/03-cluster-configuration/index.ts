import * as azure from "@pulumi/azure";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as tls from "@pulumi/tls";
import { config } from "./config";

const name = pulumi.getProject();

// Create an SSH public key that will be used by the Kubernetes cluster.
// Note: We create one here to simplify the demo, but a production
// deployment would probably pass an existing key in as a variable.
const sshPublicKey = new tls.PrivateKey(`${name}-sshKey`, {
    algorithm: "RSA",
    rsaBits: 4096,
}).publicKeyOpenssh;

// Create the AKS cluster.
const cluster = new azure.containerservice.KubernetesCluster(`${name}`, {
    resourceGroupName: config.resourceGroupName,
    agentPoolProfiles: [{
        name: "performant",
        count: 3,
        vmSize: "Standard_DS4_v2",
        osType: "Linux",
        osDiskSizeGb: 30,
        vnetSubnetId: config.subnetId,
    }, {
        name: "standard",
        count: 2,
        vmSize: "Standard_B2s",
        osType: "Linux",
        osDiskSizeGb: 30,
        vnetSubnetId: config.subnetId,
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
        clientId: config.adClientAppId,
        clientSecret: config.adClientAppSecret,
    },
    kubernetesVersion: "1.14.8",
    roleBasedAccessControl: {
        enabled: true,
        azureActiveDirectory: {
            clientAppId: config.adClientAppId,
            serverAppId: config.adServerAppId,
            serverAppSecret: config.adServerAppSecret,
        },
    },
    networkProfile: {
        networkPlugin: "azure",
        dnsServiceIp: "10.2.2.254",
        serviceCidr: "10.2.2.0/24",
        dockerBridgeCidr: "172.17.0.1/16",
    },
    addonProfile: {
        omsAgent: {
            enabled: true,
            logAnalyticsWorkspaceId: config.logAnalyticsWorkspaceId,
        },
    },
});

// Create a static public IP for the Service LoadBalancer.
const staticAppIp = new azure.network.PublicIp(`${name}-staticAppIp`, {
    resourceGroupName: cluster.nodeResourceGroup,
    allocationMethod: "Static",
}).ipAddress;

// Export the cluster details.
export const kubeconfig = cluster.kubeConfigRaw;
export const kubeconfigAdmin = cluster.kubeAdminConfigRaw;
export const clusterId = cluster.id;
export const clusterName = cluster.name;

// Define a k8s provider instance of the cluster.
// Use admin config to get enough permissions for role binding.
const provider = new k8s.Provider(`${name}-aks`, {
    kubeconfig: cluster.kubeAdminConfigRaw,
});

const adminRole = new k8s.rbac.v1.ClusterRoleBinding("pulumi-admins", {
    subjects: [{
        apiGroup: "rbac.authorization.k8s.io",
        kind: "Group",
        name: config.adGroupAdmins,
    }],
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "cluster-admin",
    },
}, { provider });

// Create Kubernetes namespaces.
const clusterSvcsNamespace = new k8s.core.v1.Namespace("cluster-svcs", undefined, { provider, dependsOn: [adminRole] });
export const clusterSvcsNamespaceName = clusterSvcsNamespace.metadata.name;

const appSvcsNamespace = new k8s.core.v1.Namespace("app-svcs", undefined, { provider, dependsOn: [adminRole] });
export const appSvcsNamespaceName = appSvcsNamespace.metadata.name;

const appsNamespace = new k8s.core.v1.Namespace("apps", undefined, { provider, dependsOn: [adminRole] });
export const appsNamespaceName = appsNamespace.metadata.name;

const nginxNs = new k8s.core.v1.Namespace("ingress-nginx", {metadata: {name: "ingress-nginx"}}, { provider, dependsOn: [adminRole] });

// Create a resource quota in the apps namespace.
const quotaAppNamespace = new k8s.core.v1.ResourceQuota("apps", {
    metadata: {namespace: appsNamespaceName},
    spec: {
        hard: {
            cpu: "20",
            memory: "1Gi",
            pods: "10",
            replicationcontrollers: "20",
            resourcequotas: "1",
            services: "5",
        },
    },
}, { provider });

// Create a limited role for the `pulumi:devs` to use in the apps namespace.
const roleNamespaces = [appsNamespaceName, nginxNs.metadata.name];
roleNamespaces.forEach((roleNs, index) => {
    const devsGroupRole = new k8s.rbac.v1.Role(`pulumi-devs-${index}`,
        {
            metadata: { namespace: roleNs },
            rules: [
                {
                    apiGroups: [""],
                    resources: ["configmap", "pods", "secrets", "services", "persistentvolumeclaims"],
                    verbs: ["get", "list", "watch", "create", "update", "delete"],
                },
                {
                    apiGroups: ["rbac.authorization.k8s.io"],
                    resources: ["clusterrole", "clusterrolebinding", "role", "rolebinding"],
                    verbs: ["get", "list", "watch", "create", "update", "delete"],
                },
                {
                    apiGroups: ["extensions", "apps"],
                    resources: ["replicasets", "deployments"],
                    verbs: ["get", "list", "watch", "create", "update", "delete"],
                },
            ],
        },
        { provider },
    );

    // Bind the `pulumi:devs` RBAC group to the new, limited role.
    const devsGroupRoleBinding = new k8s.rbac.v1.RoleBinding(`pulumi-devs-${index}`,
        {
            metadata: { namespace: roleNs },
            subjects: [{
                kind: "Group",
                name: config.adGroupDevs,
            }],
            roleRef: {
                apiGroup: "rbac.authorization.k8s.io",
                kind: "Role",
                name: devsGroupRole.metadata.name,
            },
        }, { provider });
});

// Create the premium StorageClass.
const sc = new k8s.storage.v1.StorageClass("premium",
    {
        provisioner: "kubernetes.io/azure-disk",
        parameters: {
            "storageaccounttype": "Premium_LRS",
            "kind": "Managed"
        },
}, { provider: provider });

// Create a Persistent Volume Claim on the StorageClass.
const myPvc = new k8s.core.v1.PersistentVolumeClaim("mypvc", {
    spec: {
        accessModes: ["ReadWriteOnce"],
        storageClassName: sc.metadata.name,
        resources: {requests: {storage: "1Gi"}}
    }
}, { provider: provider });

// Create a restrictive PodSecurityPolicy.
const restrictivePSP = new k8s.policy.v1beta1.PodSecurityPolicy("demo-restrictive", {
    metadata: { name: "demo-restrictive" },
    spec: {
        privileged: false,
        hostNetwork: false,
        allowPrivilegeEscalation: false,
        defaultAllowPrivilegeEscalation: false,
        hostPID: false,
        hostIPC: false,
        runAsUser: { rule: "RunAsAny" },
        fsGroup: { rule: "RunAsAny" },
        seLinux: { rule: "RunAsAny" },
        supplementalGroups: { rule: "RunAsAny" },
        volumes: [
            "configMap",
            "downwardAPI",
            "emptyDir",
            "persistentVolumeClaim",
            "secret",
            "projected"
        ],
        allowedCapabilities: [
            "*"
        ]
    }
}, { provider: provider });

// Create a ClusterRole to use the restrictive PodSecurityPolicy.
const restrictiveClusterRole = new k8s.rbac.v1.ClusterRole("demo-restrictive", {
    metadata: { name: "demo-restrictive" },
    rules: [
        {
            apiGroups: [
                "policy"
            ],
            resourceNames: [
                restrictivePSP.metadata.name,
            ],
            resources: [
                "podsecuritypolicies"
            ],
            verbs: [
                "use"
            ]
        }
    ]
}, { provider: provider });

// Create a ClusterRoleBinding for the ServiceAccounts of Namespace kube-system
// to the ClusterRole that uses the restrictive PodSecurityPolicy.
const allowRestrictedKubeSystemCRB = new k8s.rbac.v1.ClusterRoleBinding("allow-restricted-kube-system", {
    metadata: { name: "allow-restricted-kube-system" },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: restrictiveClusterRole.metadata.name
    },
    subjects: [
        {
            kind: "Group",
            name: "system:serviceaccounts",
            namespace: "kube-system"
        }
    ]
});

// Create a ClusterRoleBinding for the RBAC group pulumi:devs
// to the ClusterRole that uses the restrictive PodSecurityPolicy.
const allowRestrictedAppsCRB = new k8s.rbac.v1.ClusterRoleBinding("allow-restricted-apps", {
    metadata: { name: "allow-restricted-apps" },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: restrictiveClusterRole.metadata.name
    },
    subjects: [
        {
            kind: "Group",
            name: "pulumi:devs",
            namespace: appsNamespaceName
        }
    ]
}, { provider: provider });

// Create a ClusterRoleBinding for the SeviceAccounts of Namespace ingress-nginx
// to the ClusterRole that uses the privileged PodSecurityPolicy.
const privilegedCRB = new k8s.rbac.v1.ClusterRoleBinding("privileged", {
    metadata: { name: "allow-privileged-ingress-nginx" },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "psp:privileged"
    },
    subjects: [
        {
            kind: "Group",
            name: "system:serviceaccounts:ingress-nginx",
            apiGroup: "rbac.authorization.k8s.io"
        }
    ]
}, { provider: provider });
