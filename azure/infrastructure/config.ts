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

const config = new pulumi.Config();

export const identityStackName = config.require("identityStackName");
const identityStack = new pulumi.StackReference(identityStackName);
//
// Azure-specific config.
//

export const resourceGroupName = identityStack.getOutput("resourceGroupName");
export const location = identityStack.getOutput("location");
export const applicationID = identityStack.getOutput("applicationID");
export const servicePrincipalPassword = identityStack.getOutput("servicePrincipalPassword");

//
// AKS-specific config.
//

export const nodeCount = config.getNumber("nodeCount") || 2;
export const nodeSize = config.get("nodeSize") || "Standard_D2_v2";
export const sshPublicKey = config.require("sshPublicKey");
