import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import { config } from "./config";

const name = pulumi.getProject();
export const adminsIamServiceAccountSecret = config.adminsIamServiceAccountSecret;
export const devsIamServiceAccountSecret = config.devsIamServiceAccountSecret;

// Generate a strong password for the cluster.
const password = new random.RandomPassword(`${name}-password`, { 
    length: 20,
}).result;

// Create the GKE cluster.
const cluster = new gcp.container.Cluster(`${name}`, {
    // We can't create a cluster with no node pool defined, but we want to only use
    // separately managed node pools. So we create the smallest possible default
    // node pool and immediately delete it.
    removeDefaultNodePool: true,
    initialNodeCount: 1,
    podSecurityPolicyConfig: { enabled: true },
    network: config.networkName,
    subnetwork: config.subnetworkName,
    minMasterVersion: "1.14.7-gke.17",
    masterAuth: { username: "example-user", password: password },
});

const standardNodes = new gcp.container.NodePool("standard-nodes", {
    cluster: cluster.name,
    version: "1.14.7-gke.17",
    autoscaling: {minNodeCount: 0, maxNodeCount: 3},
    initialNodeCount: 2,
    nodeConfig: {
        machineType: "n1-standard-1",
        oauthScopes: [
            "https://www.googleapis.com/auth/compute",
            "https://www.googleapis.com/auth/devstorage.read_only",
            "https://www.googleapis.com/auth/logging.write",
            "https://www.googleapis.com/auth/monitoring",
        ],
        labels: {"instanceType": "n1-standard-1"},
        tags: ["org-pulumi"],
    },
});

const performantNodes = new gcp.container.NodePool("performant-nodes", {
    cluster: cluster.name,
    version: "1.14.7-gke.17",
    autoscaling: {minNodeCount: 0, maxNodeCount: 3},
    initialNodeCount: 2,
    nodeConfig: {
        machineType: "n1-standard-16",
        oauthScopes: [
            "https://www.googleapis.com/auth/compute",
            "https://www.googleapis.com/auth/devstorage.read_only",
            "https://www.googleapis.com/auth/logging.write",
            "https://www.googleapis.com/auth/monitoring",
        ],
        labels: {"instanceType": "n1-standard-16"},
        tags: ["org-pulumi"],
        taints: [{key: "special", value: "true", effect: "NO_SCHEDULE"}],
    },
});

// Manufacture a GKE-style Kubeconfig. Note that this is slightly
// "different" because of the way GKE requires gcloud to be in the
// picture for cluster authentication (rather than using the client
// cert/key directly).
const k8sConfig = pulumi
    .all([cluster.name, cluster.endpoint, cluster.masterAuth])
    .apply(([name, endpoint, auth]) => {
        const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
        return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    auth-provider:
      config:
        cmd-args: config config-helper --format=json
        cmd-path: gcloud
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
      name: gcp
`;
    });

// Export the cluster details.
export const kubeconfig = k8sConfig;
export const clusterName = cluster.name;

// Expose a k8s provider instance of the cluster.
const provider = new k8s.Provider(`${name}-gke`, { kubeconfig: k8sConfig });

// Create Kubernetes namespaces.
const clusterSvcsNamespace = new k8s.core.v1.Namespace("cluster-svcs", undefined, {
    provider: provider,
});
export const clusterSvcsNamespaceName = clusterSvcsNamespace.metadata.name;

const appSvcsNamespace = new k8s.core.v1.Namespace("app-svcs", undefined, { provider: provider });
export const appSvcsNamespaceName = appSvcsNamespace.metadata.name;

const appsNamespace = new k8s.core.v1.Namespace("apps", undefined, { provider: provider });
export const appsNamespaceName = appsNamespace.metadata.name;

const nginxNs = new k8s.core.v1.Namespace("ingress-nginx", {metadata: {name: "ingress-nginx"}}, { provider: provider});

// Create a resource quota in the apps namespace.
const quotaAppNamespace = new k8s.core.v1.ResourceQuota("apps",
    {
        metadata: { namespace: appsNamespaceName },
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
}, { provider: provider });

// Create a limited role for the `pulumi:devs` to use in the apps namespace.
const devsGroupRole = new k8s.rbac.v1.Role(`pulumi-devs`,
    {
        metadata: { namespace: appsNamespaceName },
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
}, { provider: provider });

// Bind the `pulumi:devs` RBAC group to the new, limited role.
const devsGroupRoleBinding = pulumi.all([
    config.project,
    config.devsAccountId,
]).apply(([project, devsAccountId]) => {
    return new k8s.rbac.v1.RoleBinding(`pulumi-devel`,
        {
            metadata: { namespace: appsNamespaceName },
            subjects: [{
                kind: "User",
                name: `${devsAccountId}@${project}.iam.gserviceaccount.com`,
            }],
            roleRef: {
                apiGroup: "rbac.authorization.k8s.io",
                kind: "Role",
                name: devsGroupRole.metadata.name,
            },
}, { provider: provider });

// Create the standard StorageClass.
const sc = new k8s.storage.v1.StorageClass("standard",
    {
        provisioner: "kubernetes.io/gce-pd",
        parameters: {
            "type": "pd-standard",
            "replication-type": "none"
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
});

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
}, { provider: provider });

// Create a ClusterRoleBinding for the RBAC devs account ID
// to the ClusterRole that uses the restrictive PodSecurityPolicy.
const allowRestrictedAppsCRB = pulumi.all([
    config.project,
    config.devsAccountId,
]).apply(([project, devsAccountId]) => {
    return new k8s.rbac.v1.ClusterRoleBinding("allow-restricted-apps", {
        metadata: { name: "allow-restricted-apps" },
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "ClusterRole",
            name: restrictiveClusterRole.metadata.name
        },
        subjects: [{
            kind: "User",
            name: `${devsAccountId}@${project}.iam.gserviceaccount.com`,
            namespace: appsNamespaceName
        }],
    }, { provider: provider });
});

// Create a ClusterRoleBinding for the SeviceAccounts of Namespace ingress-nginx
// to the ClusterRole that uses the privileged PodSecurityPolicy.
const privilegedCRB = new k8s.rbac.v1.ClusterRoleBinding("privileged", {
    metadata: { name: "allow-privileged-ingress-nginx" },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "gce:podsecuritypolicy:privileged"
    },
    subjects: [
        {
            kind: "Group",
            name: "system:serviceaccounts:ingress-nginx",
            apiGroup: "rbac.authorization.k8s.io"
        }
    ]
}, { provider: provider });
