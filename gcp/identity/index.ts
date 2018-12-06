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

import * as gcp from "@pulumi/gcp";

import * as config from "./config";
import * as util from "./util";

//
// Assign infrastructure CI service account Cloud SQL and GKE cluster admin privileges -- i.e.,
// privileges to add/delete these things, but not privileges to change apps inside.
//

const infraCiId = "infraCi";

const infraCi = new gcp.serviceAccount.Account(infraCiId, {
    project: config.project,
    accountId: "infra-ci",
    displayName: "Infrastructure CI account"
});

const infraCiClusterAdminRole = util.bindToRole(`${infraCiId}ClusterAdmin`, infraCi, {
    project: config.project,
    role: "roles/container.clusterAdmin"
});

const infraCiCloudSqlAdminRole = util.bindToRole(`${infraCiId}CloudSqlAdmin`, infraCi, {
    project: config.project,
    role: "roles/cloudsql.admin"
});

const infraCiKey = util.createCiKey(`${infraCiId}Key`, infraCi);

// Export client secret so that CI/CD systems can authenticate as this service account.
export const infraCiClientSecret = util.clientSecret(infraCiKey);

//
// Assign application CI service account container developer privileges -- i.e., privileges to
// change anything in GKE, but not to delete/add GKE clusters.
//

const k8sAppDevCiId = "k8sAppDev";

const k8sAppDevCi = new gcp.serviceAccount.Account(k8sAppDevCiId, {
    project: config.project,
    accountId: "k8s-app-dev-ci",
    displayName: "Infrastructure CI account"
});

const k8sAppDevRole = util.bindToRole(k8sAppDevCiId, k8sAppDevCi, {
    project: config.project,
    role: "roles/container.developer"
});

const k8sAppDevCiKey = util.createCiKey(`${k8sAppDevCiId}Key`, k8sAppDevCi);

// Export client secret so that CI/CD systems can authenticate as this service account.
export const k8sAppDevCiClientSecret = util.clientSecret(k8sAppDevCiKey);

//
// Export project name for downstream stacks.
//

export const project = config.project;
