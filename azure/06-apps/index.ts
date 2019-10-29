// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";

const name = pulumi.getProject();

// A k8s provider instance of the cluster.
const provider = new k8s.Provider(`${name}-aks`, {
    kubeconfig: config.kubeconfig,
});

// Boot up nodejs Helm chart example using the MongoDB instance of CosmosDB from App Services.
const node = new k8s.helm.v2.Chart(
    "node",
    {
        repo: "bitnami",
        chart: "node",
        version: "4.0.1",
        values: {
            serviceType: "LoadBalancer",
            mongodb: { install: false },
            externaldb: { ssl: true, secretName: "mongo-secrets" },
        },
    },
    { providers: { kubernetes: provider } },
);

// Export the public IP address for Kubernetes application.
export const frontendAddress = node
    .getResourceProperty("v1/Service", "node-node", "status")
    .apply(status => status.loadBalancer.ingress[0].ip);
