import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";
import { config } from "./config";

const name = pulumi.getProject();

// Create a Virtual Network for the cluster
const vnet = new azure.network.VirtualNetwork(name, {
    resourceGroupName: config.resourceGroupName,
    addressSpaces: ["10.2.0.0/16"],
});

// Create a Subnet for the cluster
const subnet = new azure.network.Subnet(name, {
    resourceGroupName: config.resourceGroupName,
    virtualNetworkName: vnet.name,
    addressPrefix: "10.2.1.0/24",
});

// Log and Monitoring workspace
const loganalytics = new azure.operationalinsights.AnalyticsWorkspace(name, {
    resourceGroupName: config.resourceGroupName,
    sku: "PerGB2018",
    retentionInDays: 30,
});

// Export outputs for other stacks
export const subnetId = subnet.id;
export const logAnalyticsWorkspaceId = loganalytics.id;
