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

import * as gcp from "@pulumi/gcp";

import * as config from "./config";
import * as util from "./util";

// Create the GKE cluster admins ServiceAccount.
const adminsName = "admins";
const adminsIamServiceAccount = new gcp.serviceAccount.Account(adminsName, {
    project: config.project,
    accountId: `k8s-${adminsName}`,
    displayName: "Kubernetes Admins",
});

// Bind the admin ServiceAccount to be a GKE cluster admin.
const adminsIamRoleBinding = util.bindToRole(`${adminsName}ClusterAdmin`, adminsIamServiceAccount, {
    project: config.project,
    role: "roles/container.clusterAdmin",
});

// Bind the admin ServiceAccount to be a CloudSQL admin.
const cloudSqlIamRoleBinding = util.bindToRole(`${adminsName}CloudSqlAdmin`, adminsIamServiceAccount, {
    project: config.project,
    role: "roles/cloudsql.admin",
});

// Export the admins ServiceAccount key.
const adminsIamServiceAccountKey = util.createServiceAccountKey(`${adminsName}Key`, adminsIamServiceAccount);

// Export the admins ServiceAccount client secret to authenticate as this service account.
export const adminsIamServiceAccountSecret = util.clientSecret(adminsIamServiceAccountKey);

// Create the GKE cluster developers ServiceAccount.
const devName = "devs";
const devsIamServiceAccount = new gcp.serviceAccount.Account(devName, {
    project: config.project,
    accountId: `k8s-${devName}`,
    displayName: "Kubernetes Developers",
});

// Bind the devs ServiceAccount to be a GKE cluster developer.
const devsIamRoleBinding = util.bindToRole(devName, devsIamServiceAccount, {
    project: config.project,
    role: "roles/container.developer",
});

// Export the devs ServiceAccount key.
const devsIamServiceAccountKey = util.createServiceAccountKey(`${devName}Key`, devsIamServiceAccount);

// Export the devs ServiceAccount client secret to authenticate as this service account.
export const devsIamServiceAccountClientSecret = util.clientSecret(devsIamServiceAccountKey);

// Export the project name for downstream stacks.
export const project = config.project;
