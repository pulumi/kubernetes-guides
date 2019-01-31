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

import * as awsinfra from "@pulumi/aws-infra";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";
import * as config from "./config";

// Create a VPC for the EKS cluster and its nodes if necessary.
let vpcId: pulumi.Input<string> = config.vpcId!;
let publicSubnetIds: pulumi.Input<string>[] = config.publicSubnetIds!;
let privateSubnetIds: pulumi.Input<string>[] = config.privateSubnetIds!;
if (config.vpcId === undefined) {
    const network = new awsinfra.Network("network", {
        usePrivateSubnets: config.usePrivateSubnets,
        numberOfAvailabilityZones: config.numberOfAvailabilityZones,
    });
    vpcId = network.vpcId;
    publicSubnetIds = network.publicSubnetIds;
    privateSubnetIds = config.usePrivateSubnets ? network.subnetIds : undefined;
}

// Import the identity stack for its roles.
const identityStack = new pulumi.StackReference("identityStack", { name: config.identityStack });
const kubeAppRole = identityStack.getOutput("kubeAppRoleArn");
kubeAppRole.apply(role => {
    if (role === undefined) {
        throw Error(`Stack output ${identityStack}.kubeAppRoleArn is undefined`);
    }
});

// Create the EKS cluster itself.
const eksCluster = new eks.Cluster("eksCluster", {
    vpcId: vpcId,
    subnetIds: [...publicSubnetIds, ...(privateSubnetIds || [])],
    roleMappings: [
        // TODO: Find a slightly more restrictive permission for this.
        {
            roleArn: kubeAppRole,
            username: kubeAppRole,
            groups: ["system:masters"],
        },
    ],
    instanceType: <any>config.instanceType,
    nodePublicKey: config.publicKey,
    desiredCapacity: config.desiredCapacity,
    minSize: config.minSize,
    maxSize: config.maxSize,
    storageClasses: config.storageClass,
});

export const kubeconfig = eksCluster.kubeconfig;
