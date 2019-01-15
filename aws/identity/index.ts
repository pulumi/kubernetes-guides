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

import * as aws from "@pulumi/aws";
import * as util from "./lib/util";

import * as groups from "./lib/groups";
import * as policies from "./lib/policies";

//
// User/role for networking CI. Networking admin.
//

const networkCiId = "networkAdminCi";
const networkCiUser = new util.BotUser(networkCiId);
new aws.iam.UserGroupMembership(`${networkCiId}Groups`, {
    user: networkCiUser.name,
    groups: [groups.networkAdmins.name]
});
const networkCiUserAccessKey = new aws.iam.AccessKey(`${networkCiId}Key`, {
    user: networkCiUser.name
});

// Export login credentials for CI/CD.
export const networkCiUserAccessKeyId = networkCiUserAccessKey.id;
export const networkCiUserAccessKeySecret = networkCiUserAccessKey.secret;

//
// EKS management user. Deploys EKS, passes AWS IAM Role ARNs to EKS, so that workloads can be
// correlated to AWS IAM.
//

const eksCiId = "eksCiUser";
const eksCiUser = new util.BotUser(eksCiId);
new aws.iam.UserGroupMembership(`${eksCiId}Groups`, {
    user: eksCiUser.name,
    groups: [
        // TODO: Remove the "administrator" group when we pull VPC and security policies out and
        // manage them separately from the EKS package.
        groups.eksAdmins.name,
        groups.networkAdmins.name, // TODO: Revoke network admin.
        groups.useExistingIamRoles.name // To use pass role ARNs to k8s RoleBindings.
    ]
});
const eksCiUserAccessKey = new aws.iam.AccessKey(`${eksCiId}Key`, {
    user: eksCiUser.name
});

export const eksCiUserAccessKeyId = eksCiUserAccessKey.id;
export const eksCiUserAccessKeySecret = eksCiUserAccessKey.secret;

//
// Kubernetes application role. Has access to ECR.
//

const kubeAppRole = util.newRoleWithPolicies(
    "kubeAppRole",
    {
        description: "Infrastructure management role for CI users",
        assumeRolePolicy: eksCiUser.arn.apply(util.assumeRolePolicy)
    },
    {
        ecrPowerUser: aws.iam.AmazonEC2ContainerRegistryPowerUser,
        passRole: policies.useExistingIamRoles.arn
    }
);
export const kubeAppRoleArn = kubeAppRole.arn;
