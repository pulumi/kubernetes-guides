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
util.bindToRole(`${adminsName}-k8s`, adminsIamServiceAccount, {
    project: config.project,
    roles: ["roles/container.admin", "roles/container.clusterAdmin", "roles/container.developer"],
});

// Bind the admin ServiceAccount to be a CloudSQL admin.
util.bindToRole(`${adminsName}-cloudsql`, adminsIamServiceAccount, {
    project: config.project,
    roles: ["roles/cloudsql.admin"],
});

// Export the admins ServiceAccount key.
const adminsIamServiceAccountKey = util.createServiceAccountKey(`${adminsName}Key`, adminsIamServiceAccount);

// Export the admins ServiceAccount client secret to authenticate as this service account.
export const adminsIamServiceAccountSecret = util.clientSecret(adminsIamServiceAccountKey);

// Create the GKE cluster developers ServiceAccount.
const devsName = "devs";
const devsIamServiceAccount = new gcp.serviceAccount.Account(devsName, {
    project: config.project,
    accountId: `k8s-${devsName}`,
    displayName: "Kubernetes Developers",
});

// Bind the devs ServiceAccount to be a GKE cluster developer.
util.bindToRole(`${devsName}-k8s`, devsIamServiceAccount, {
    project: config.project,
    roles: ["roles/container.developer"],
});

// Export the devs ServiceAccount key.
const devsIamServiceAccountKey = util.createServiceAccountKey(`${devsName}Key`, devsIamServiceAccount);

// Export the devs ServiceAccount client secret to authenticate as this service account.
export const devsIamServiceAccountClientSecret = util.clientSecret(devsIamServiceAccountKey);

// Export the project name for downstream stacks.
export const project = config.project;
