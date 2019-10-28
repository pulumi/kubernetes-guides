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

const config = new pulumi.Config();

export const identityStackName = config.require("identityStackName");
const identityStack = new pulumi.StackReference(identityStackName);

//
// GCP-specific config.
//

// project is the GCP project you are going to deploy to.
export const project = identityStack.getOutput("project");

// zone is the zone in which to build the cluster.
export const zone = config.require("zone");

export const envName = config.require("envName");
