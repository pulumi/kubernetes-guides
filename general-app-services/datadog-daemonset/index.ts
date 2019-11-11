// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
// import * as kx from "@pulumi/kubernetesx";
import { config } from "./config";

// Create a k8s Provider, and scope it to the App Services Namespace.
const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appSvcsNamespaceName,
});

// Create a Deployment that uses the database credentials as environment variables.
const appName = "datadog";
const appLabels = { app: appName };

// Create a ServiceAccount for DataDog.
const ddServiceAccount = new k8s.core.v1.ServiceAccount(appName,
    {metadata: {labels: appLabels}},
    {provider: provider},
);

// Create a ConfigMap to hold the DataDog env variables.
const ddConfigMap = new k8s.core.v1.ConfigMap(appName,
    {
        metadata: {labels: appLabels},
        data: {
            "DD_API_KEY": config.datadogApiKey,
            "DD_PROCESS_AGENT_ENABLED": "true",
            "DD_LOGS_ENABLED": "true",
            "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL": "true",
            "DD_COLLECT_KUBERNETES_EVENTS": "true",
            "DD_LEADER_ELECTION": "true",
            "KUBERNETES": "true",
        },
    }, {provider: provider},
);

// Create a Role for DataDog to work with resources.
const ddClusterRole = new k8s.rbac.v1.ClusterRole(appName,
    {
        rules: [
            {   // To get info, statuses, and events.
                apiGroups: [""],
                resources: ["services", "events", "endpoints", "pods", "nodes", "componentstatuses"],
                verbs: ["get", "list", "watch"],
            },
            {   // To create the leader election token
                apiGroups: [""],
                resources: ["configmaps"],
                // datadogtoken: Kubernetes event collection state
                // datadog-leader-election: Leader election token
                resourceNames: ["datadogtoken", "datadog-leader-election"],
                verbs: ["get", "update"],
            },
            {   // To create the leader election token
                apiGroups: [""],
                resources: ["configmaps"],
                verbs: ["create"],
            },
            {   // Kubelet connectivity
                apiGroups: [""],
                resources: ["nodes/metrics", "nodes/spec", "nodes/proxy"],
                verbs: ["get"],
            },
            {   // To get info and statuses.
                nonResourceURLs: [ "/version", "/healthz"],
                verbs: ["get"],
            },
        ],
    }, {provider: provider},
);

// Create a RoleBinding for DataDog to work with resources.
const ddClusterRoleBinding = new k8s.rbac.v1.ClusterRoleBinding(appName,
    {
        subjects: [
            {
                kind: "ServiceAccount",
                name: ddServiceAccount.metadata.name,
                namespace: config.appSvcsNamespaceName,
            },
        ],
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "ClusterRole",
            name: ddClusterRole.metadata.name,
        },
    }, {provider: provider},
)

// Create a DataDog DaemonSet.
const datadog = new k8s.apps.v1.DaemonSet(appName, {
    metadata: { labels: appLabels},
    spec: {
        selector: {
            matchLabels: appLabels,
        },
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [
                    {
                        image: "datadog/agent:latest",
                        name: "nginx",
                        resources: {limits: {memory: "512Mi"}, requests: {memory: "512Mi"}},
                        env: [
                            {
                                name: "DD_KUBERNETES_KUBELET_HOST",
                                valueFrom: {
                                    fieldRef: {
                                        fieldPath: "status.hostIP",
                                    },
                                },
                            },
                            {
                                name: "DD_API_KEY",
                                valueFrom: {
                                    configMapKeyRef: {
                                        name: ddConfigMap.metadata.name,
                                        key: "DD_API_KEY",
                                    },
                                },
                            },
                            {
                                name: "DD_PROCESS_AGENT_ENABLED",
                                valueFrom: {
                                    configMapKeyRef: {
                                        name: ddConfigMap.metadata.name,
                                        key: "DD_PROCESS_AGENT_ENABLED",
                                    },
                                },
                            },
                            {
                                name: "DD_LOGS_ENABLED",
                                valueFrom: {
                                    configMapKeyRef: {
                                        name: ddConfigMap.metadata.name,
                                        key: "DD_LOGS_ENABLED",
                                    },
                                },
                            },
                            {
                                name: "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL",
                                valueFrom: {
                                    configMapKeyRef: {
                                        name: ddConfigMap.metadata.name,
                                        key: "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL",
                                    },
                                },
                            },
                            {
                                name: "DD_COLLECT_KUBERNETES_EVENTS",
                                valueFrom: {
                                    configMapKeyRef: {
                                        name: ddConfigMap.metadata.name,
                                        key: "DD_COLLECT_KUBERNETES_EVENTS",
                                    },
                                },
                            },
                            {
                                name: "DD_LEADER_ELECTION",
                                valueFrom: {
                                    configMapKeyRef: {
                                        name: ddConfigMap.metadata.name,
                                        key: "DD_LEADER_ELECTION",
                                    },
                                },
                            },
                            {
                                name: "KUBERNETES",
                                valueFrom: {
                                    configMapKeyRef: {
                                        name: ddConfigMap.metadata.name,
                                        key: "KUBERNETES",
                                    },
                                },
                            },
                        ],
                        volumeMounts: [
                            {name: "dockersocket", mountPath: "/var/run/docker.sock"},
                            {name: "proc", mountPath: "/host/proc"},
                            {name: "cgroup", mountPath: "/host/sys/fs/cgroup"},
                        ],
                        livenessProbe: {
                            exec: {
                                command: [
                                    "./probe.sh",
                                ],
                            },
                            initialDelaySeconds: 15,
                            periodSeconds: 5,
                        },
                    },
                ],
                volumes: [
                    {name: "dockersocket", hostPath: {path: "/var/run/docker.sock"}},
                    {name: "proc", hostPath: {path: "/proc"}},
                    {name: "cgroup", hostPath: {path: "/sys/fs/cgroup"}},
                ],
            },
        },
    },
}, { provider: provider });
