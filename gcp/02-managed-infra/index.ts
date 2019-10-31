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

const projectName = pulumi.getProject();

// Create a new network.
const network = new gcp.compute.Network(projectName, {
    autoCreateSubnetworks: false,
});
export const networkName = network.name;

// Create a new subnet.
const subnet = new gcp.compute.Subnetwork(projectName, {
    ipCidrRange: "10.0.0.0/24",
    network: network.name,
    secondaryIpRanges: [{ rangeName: "pods", ipCidrRange: "10.1.0.0/16" }],
});
export const subnetworkName = subnet.name;
