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

import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";
import * as config from "./config";

// Now allocate an AKS cluster.
const k8sCluster = new azure.containerservice.KubernetesCluster("aksCluster", {
    resourceGroupName: config.resourceGroupName,
    location: config.location,
    agentPoolProfile: {
        name: "aksagentpool",
        count: config.nodeCount,
        vmSize: config.nodeSize,
    },
    dnsPrefix: `${pulumi.getStack()}-kube`,
    linuxProfile: {
        adminUsername: "aksuser",
        sshKeys: [
            {
                keyData: config.sshPublicKey,
            },
        ],
    },
    servicePrincipal: {
        clientId: config.applicationID,
        clientSecret: config.servicePrincipalPassword,
    },
});

//
// Export required properties for downstream stacks.
//

export const kubeconfig = k8sCluster.kubeConfigRaw;
