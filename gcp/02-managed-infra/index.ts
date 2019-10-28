// Copyright 2016-2019, Pulumi Corporation.
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
        special: true,
    }).result,
};

const network = new gcp.compute.Network(name, {
    project: config.project,
    autoCreateSubnetworks: false,
});
export const networkName = network.name;

const subnet = new gcp.compute.Subnetwork(name, {
    project: config.project,
    region: pulumi.output(config.zone).apply(zone =>
        (<string>zone)
            .split("-")
            .slice(0, 2)
            .join("-"),
    ),
    ipCidrRange: "10.0.0.0/24",
    network: network.name,
    secondaryIpRanges: [{ rangeName: "pods", ipCidrRange: "10.1.0.0/16" }],
});
export const subnetworkName = subnet.name;
