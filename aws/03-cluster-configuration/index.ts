import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { config } from "./config";

const projectName = pulumi.getProject();

export const adminsIamRoleArn = config.adminsIamRoleArn
export const devsIamRoleArn = config.devsIamRoleArn
export const stdNodegroupIamRoleArn = config.stdNodegroupIamRoleArn
export const perfNodegroupIamRoleArn = config.perfNodegroupIamRoleArn
const adminsIamRoleName = adminsIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
const devsIamRoleName = devsIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
const stdNodegroupIamRoleName = stdNodegroupIamRoleArn.apply(s => s.split("/")).apply(s => s[1])
const perfNodegroupIamRoleName = perfNodegroupIamRoleArn.apply(s => s.split("/")).apply(s => s[1])

// Create an EKS cluster.
const cluster = new eks.Cluster(`${projectName}`, {
    instanceRoles: [
        aws.iam.Role.get("adminsIamRole", stdNodegroupIamRoleName),
        aws.iam.Role.get("devsIamRole", perfNodegroupIamRoleName),
    ],
    roleMappings: [
        {
            roleArn: config.adminsIamRoleArn,
            groups: ["system:masters"],
            username: "pulumi:admins",
        },
        {
            roleArn: config.devsIamRoleArn,
            groups: ["pulumi:devs"],
            username: "pulumi:alice",
        },
    ],
    vpcId: config.vpcId,
    publicSubnetIds: config.publicSubnetIds,
    privateSubnetIds: config.privateSubnetIds,
    storageClasses: {
        "gp2-encrypted": { type: "gp2", encrypted: true},
        "sc1": { type: "sc1"}
    },
    nodeAssociatePublicIpAddress: false,
    skipDefaultNodeGroup: true,
    deployDashboard: false,
    version: "1.14",
    tags: {
        "Project": "k8s-aws-cluster",
        "Org": "pulumi",
    },
    clusterSecurityGroupTags: { "ClusterSecurityGroupTag": "true" },
    nodeSecurityGroupTags: { "NodeSecurityGroupTag": "true" },
    enabledClusterLogTypes: ["api", "audit", "authenticator", "controllerManager", "scheduler"],
    // endpointPublicAccess: false,     // Requires bastion to access cluster API endpoint
    // endpointPrivateAccess: true,     // Requires bastion to access cluster API endpoint
});

// Export the cluster details.
export const kubeconfig = cluster.kubeconfig.apply(JSON.stringify);
export const clusterName = cluster.core.cluster.name;
export const region = aws.config.region;
export const securityGroupIds = [cluster.nodeSecurityGroup.id];

// Create a Standard node group of t2.medium workers.
const ngStandard = new eks.NodeGroup(`${projectName}-ng-standard`, {
    cluster: cluster,
    instanceProfile: new aws.iam.InstanceProfile("ng-standard", {role: stdNodegroupIamRoleName}),
    nodeAssociatePublicIpAddress: false,
    nodeSecurityGroup: cluster.nodeSecurityGroup,
    clusterIngressRule: cluster.eksClusterIngressRule,
    amiId: "ami-0ca5998dc2c88e64b", // k8s v1.14.7 in us-west-2
    instanceType: "t2.medium",
    desiredCapacity: 3,
    minSize: 3,
    maxSize: 10,
    labels: {"amiId": "ami-0ca5998dc2c88e64b"},
    cloudFormationTags: clusterName.apply(clusterName => ({
        "CloudFormationGroupTag": "true",
        "k8s.io/cluster-autoscaler/enabled": "true",
        [`k8s.io/cluster-autoscaler/${clusterName}`]: "true",
    })),
}, {
    providers: { kubernetes: cluster.provider},
});

// Create a 2xlarge node group of t3.2xlarge workers with taints for special workloads.
const ng2xlarge = new eks.NodeGroup(`${projectName}-ng-2xlarge`, {
    cluster: cluster,
    instanceProfile: new aws.iam.InstanceProfile("ng-2xlarge", {role: perfNodegroupIamRoleName}),
    nodeAssociatePublicIpAddress: false,
    nodeSecurityGroup: cluster.nodeSecurityGroup,
    clusterIngressRule: cluster.eksClusterIngressRule,
    amiId: "ami-0ca5998dc2c88e64b", // k8s v1.14.7 in us-west-2
    instanceType: "t3.2xlarge",
    desiredCapacity: 5,
    minSize: 5,
    maxSize: 10,
    labels: {"amiId": "ami-0ca5998dc2c88e64b"},
    taints: { "special": { value: "true", effect: "NoSchedule"}},
    cloudFormationTags: clusterName.apply(clusterName => ({
        "CloudFormationGroupTag": "true",
        "k8s.io/cluster-autoscaler/enabled": "true",
        [`k8s.io/cluster-autoscaler/${clusterName}`]: "true",
    })),
}, {
    providers: { kubernetes: cluster.provider},
});

// Create Kubernetes namespaces.
const clusterSvcsNamespace = new k8s.core.v1.Namespace("cluster-svcs", undefined, { provider: cluster.provider });
export const clusterSvcsNamespaceName = clusterSvcsNamespace.metadata.name;

const appSvcsNamespace = new k8s.core.v1.Namespace("app-svcs", undefined, { provider: cluster.provider });
export const appSvcsNamespaceName = appSvcsNamespace.metadata.name;

const appsNamespace = new k8s.core.v1.Namespace("apps", undefined, { provider: cluster.provider });
export const appsNamespaceName = appsNamespace.metadata.name;

const nginxNs = new k8s.core.v1.Namespace("ingress-nginx", {metadata: {name: "ingress-nginx"}}, { provider: cluster.provider});

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
    }
},{
    provider: cluster.provider
});

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
        { provider: cluster.provider },
    );

    // Bind the `pulumi:devs` RBAC group to the new, limited role.
    const devsGroupRoleBinding = new k8s.rbac.v1.RoleBinding(`pulumi-devs-${index}`,
        {
            metadata: { namespace: roleNs },
            subjects: [{
                kind: "Group",
                name: "pulumi:devs",
            }],
            roleRef: {
                apiGroup: "rbac.authorization.k8s.io",
                kind: "Role",
                name: devsGroupRole.metadata.name,
            },
        }, { provider: cluster.provider });
});

// Create a persistent volume using a persistent volume claim.
if (cluster.core.storageClasses) {
    if ("gp2-encrypted" in cluster.core.storageClasses) {
        cluster.core.storageClasses["gp2-encrypted"].apply(sc => {
            sc.metadata.name.apply(name => {
                if (name) {
                    const myPvc = new k8s.core.v1.PersistentVolumeClaim("mypvc", {
                        spec: {
                            accessModes: ["ReadWriteOnce"],
                            storageClassName: name,
                            resources: {requests: {storage: "1Gi"}}
                        }
                    },
                        { provider: cluster.provider }
                    );
                }
            });
        });
    }
}

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
}, { provider: cluster.provider });


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
}, { provider: cluster.provider });

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
}, { provider: cluster.provider });

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
}, { provider: cluster.provider });

// Create a ClusterRoleBinding for the SeviceAccounts of Namespace ingress-nginx
// to the ClusterRole that uses the privileged PodSecurityPolicy.
const privilegedCRB = new k8s.rbac.v1.ClusterRoleBinding("privileged", {
    metadata: { name: "allow-privileged-ingress-nginx" },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "eks.privileged"
    },
    subjects: [
        {
            kind: "Group",
            name: "system:serviceaccounts:ingress-nginx",
            apiGroup: "rbac.authorization.k8s.io"
        }
    ]
}, { provider: cluster.provider });
