import * as gke from "@pulumi/gke";

import * as config from "./config";

//
// Create GKE cluster.
//

const cluster = new gke.Cluster(`${config.envName}`, {
    project: config.project,

    zone: config.zone,

    nodeCount: config.nodeCount,
    nodeMachineType: config.nodeMachineType
});

export const kubeconfig = cluster.kubeconfig;
