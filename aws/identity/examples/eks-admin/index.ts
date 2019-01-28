// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as aws from "@pulumi/aws";

import * as iam from "../../";
import * as util from "./util";

const baseline = new iam.BaselineIam("baselineIam", {
    groups: {
        // Create default EKS admins group.
        defineEksAdminsGroup: true,
        // Opt out of admin and database admin Groups.
        defineAdminsGroup: false,
        defineDatabaseAdminsGroup: false,
    },
});

//
// User/role for networking CI. Networking admin.
//

const networkAdminCiUser = new util.BotUser("networkAdminCiUser", {
    groupMembership: { groups: [baseline.groups.networkAdmins!.name] },
});
const networkAdminCiUserKey = networkAdminCiUser.createAccessKey("networkAdminCiUser");

// Export login credentials for CI/CD.
export const networkAdminCiUserAccessKey = {
    id: networkAdminCiUserKey.id,
    secret: networkAdminCiUserKey.secret,
};

//
// EKS management user. Deploys EKS, passes AWS IAM Role ARNs to EKS, so that workloads can be
// correlated to AWS IAM.
//

const eksAdminCiUser = new util.BotUser("eksAdminCiUser", {
    groupMembership: {
        groups: [
            // TODO: Remove the "administrator" group when we pull VPC and security policies out and
            // manage them separately from the EKS package.
            baseline.groups.eksAdmins!.name,
            baseline.groups.networkAdmins!.name, // TODO: Revoke network admin.
            baseline.groups.useExistingIamRoles!.name, // To use pass role ARNs to k8s RoleBindings.
        ],
    },
});
const eksAdminCiUserKey = eksAdminCiUser.createAccessKey("eksAdminCiUser");

export const eksUserCiUserAccessKey = {
    id: eksAdminCiUserKey.id,
    secret: eksAdminCiUserKey.secret,
};

//
// Kubernetes application role. Has access to ECR.
//

const kubeAppRole = util.newRoleWithPolicies(
    "kubeAppRole",
    {
        description: "Infrastructure management role for CI users",
        assumeRolePolicy: eksAdminCiUser.user.arn.apply(util.assumeRolePolicy),
    },
    {
        ecrPowerUser: aws.iam.AmazonEC2ContainerRegistryPowerUser,
        passRole: baseline.policies.useExistingIamRoles!.arn,
    },
);
export const kubeAppRoleArn = kubeAppRole.arn;

//
// Export group ARNs.
//

export const policyArns = baseline.policies.arns();
export const groupArns = baseline.groups.arns();
