// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

import * as config from "./config";

const name = config.envName;

// Default values for constructing the `Cluster` object.
const defaultClusterOptions = {
    nodeCount: 3,
    nodeVersion: "latest",
    nodeMachineType: "n1-standard-1",

    minMasterVersion: "latest",
    masterUsername: "admin",
    masterPassword: new random.RandomString("password", {
        length: 16,
        special: true
    }).result
};

const network = new gcp.compute.Network(name, {
    project: config.project,
    autoCreateSubnetworks: false
});

const subnet = new gcp.compute.Subnetwork(name, {
    project: config.project,
    region: pulumi.output(config.zone).apply(zone =>
        (<string>zone)
            .split("-")
            .slice(0, 2)
            .join("-")
    ),
    ipCidrRange: "10.0.0.0/24",
    network: network.name,
    secondaryIpRanges: [{ rangeName: "pods", ipCidrRange: "10.1.0.0/16" }]
});

const cluster = new gcp.container.Cluster(name, {
    project: config.project,
    zone: config.zone,
    initialNodeCount: config.nodeCount || defaultClusterOptions.nodeCount,
    nodeVersion: defaultClusterOptions.nodeVersion,
    minMasterVersion: defaultClusterOptions.minMasterVersion,
    masterAuth: {
        username: defaultClusterOptions.masterUsername,
        password: defaultClusterOptions.masterPassword
    },
    network: network.name,
    subnetwork: subnet.name,
    nodeConfig: {
        machineType: config.nodeMachineType || defaultClusterOptions.nodeMachineType,
        oauthScopes: [
            "https://www.googleapis.com/auth/compute",
            "https://www.googleapis.com/auth/devstorage.read_only",
            "https://www.googleapis.com/auth/logging.write",
            "https://www.googleapis.com/auth/monitoring"
        ]
    }
});

//
// Create GKE cluster.
//

// Manufacture a GKE-style Kubeconfig. Note that this is slightly "different" because of the way
// GKE requires gcloud to be in the picture for cluster authentication (rather than using the
// client cert/key directly).
function createKubeconfig(gkeCluster: gcp.container.Cluster): pulumi.Output<string> {
    return pulumi
        .all([gkeCluster.name, gkeCluster.endpoint, gkeCluster.masterAuth])
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
}

// Export a Kubernetes provider instance that uses our cluster from above.
function createProvider(name: string, k8sConfig: any): k8s.Provider {
    return new k8s.Provider(name, {
        kubeconfig: k8sConfig
    });
}

export const kubeconfig = createKubeconfig(cluster);
