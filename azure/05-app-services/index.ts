// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as azure from "@pulumi/azure";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import * as mongoHelpers from "./mongoHelpers";

const name = pulumi.getProject();

// Define a separate resource group for app services.
const resourceGroup = new azure.core.ResourceGroup(name);

// Create a MongoDB-flavored instance of CosmosDB.
const cosmosdb = new azure.cosmosdb.Account("k8s-az-mongodb", {
    resourceGroupName: resourceGroup.name,
    kind: "MongoDB",
    consistencyPolicy: {
        consistencyLevel: "Session",
    },
    offerType: "Standard",
    geoLocations: [
        { location: resourceGroup.location, failoverPriority: 0 },
    ],
});

// A k8s provider instance of the cluster.
const provider = new k8s.Provider(`${name}-aks`, {
    kubeconfig: config.kubeconfig,
});

// Create secret from MongoDB connection string.
const mongoConnStrings = new k8s.core.v1.Secret(
    "mongo-secrets",
    {
        metadata: { name: "mongo-secrets" },
        data: mongoHelpers.parseConnString(cosmosdb.connectionStrings),
    },
    { provider },
);
