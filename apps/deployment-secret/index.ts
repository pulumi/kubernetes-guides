// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
// import * as kx from "@pulumi/kubernetesx";
import { config } from "./config";

const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appsNamespaceName,
});

// Create a Secret with the database credentials.
const databaseSecret = new k8s.core.v1.Secret("db-secret", {
    stringData: {
        "database-username": config.databaseUsername,
        "database-password": config.databasePassword,
    }
}, { provider: provider });

// Create a Deployment that uses the database credentials as environment variables.
const appName = "nginx";
const appLabels = { app: appName };
const nginx = new k8s.apps.v1.Deployment(appName, {
    metadata: { labels: appLabels },
    spec: {
        selector: {
            matchLabels: appLabels,
        },
        replicas: 1,
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [
                    {
                        image: "nginx",
                        name: "nginx",
                        env: [
                            {
                                name: "DATABASE_USERNAME",
                                valueFrom: {
                                    secretKeyRef: {
                                        name: databaseSecret.metadata.name,
                                        key: "database-username"
                                    }
                                }
                            },
                            {
                                name: "DATABASE_PASSWORD",
                                valueFrom: {
                                    secretKeyRef: {
                                        name: databaseSecret.metadata.name,
                                        key: "database-password"
                                    }
                                }
                            }
                        ]
                    },
                ],
            },
        },
    },
}, { provider: provider });

/*
// Example using KX
//
// Create a KX Secret with the database credentials.
const databaseSecretKx = new kx.Secret("db-secret", {
    stringData: {
        "database-username": config.databaseUsername,
        "database-password": config.databasePassword,
    }
}, { provider: provider });

Create a KX PodBuilder for the demo app.
const nginxPB = new kx.PodBuilder(appName, {
    spec: {
        containers: [{
            image: "nginx",
            env: {
                "DATABASE_USERNAME": databaseSecretKx.asEnvValue("database-username"),
                "DATABASE_PASSWORD": databaseSecretKx.asEnvValue("database-password"),
            }
        }]
    }
});

Create a KX Deployment from the KX PodBuilder by transforming it into a DeploymentSpec.
The deployment use database credentials as environment variables.
const nginxDeployment = new kx.Deployment(appName, {
    spec: nginxPB.asDeploymentSpec({replicas: 1})
}, { provider: provider });
*/
