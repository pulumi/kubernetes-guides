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
import * as pulumi from "@pulumi/pulumi";

type Policies = { [name: string]: pulumi.Input<aws.ARN> };

// Helper function that creates a new IAM role and attaches the specified policies.
function newRoleWithPolicies(name: string, args: aws.iam.RoleArgs, policies: Policies): aws.iam.Role {
    const role = new aws.iam.Role(name, args);
    const policyAttachments: aws.iam.RolePolicyAttachment[] = [];
    for (const policy of Object.keys(policies)) {
        policyAttachments.push(new aws.iam.RolePolicyAttachment(`${name}-${policy}`, {
            policyArn: policies[policy],
            role: role,
        }, { parent: role }));
    }
    return role;
}

// Create an IAM user for CI/CD.
const botUserDef = new aws.iam.User("botuser");

// Create an access key for the bot user.
const accessKey = new aws.iam.AccessKey("botuser", {
    user: botUserDef.name,
});
export const botUser = {
    arn: botUserDef.arn,
    name: botUserDef.name,
    accessKey: accessKey.id,
    secretKey: accessKey.secret,
};

const assumeRolePolicy = botUserDef.arn.apply(botUserArn => (<aws.iam.PolicyDocument>{
    Version: "2012-10-17",
    Statement: [{
        Effect: "Allow",
       Principal: {
           AWS: botUserArn,
       },
       Action: "sts:AssumeRole",
    }],
}));

// Create an IAM role with appropriate permissions for infrastructure management
const infraPolicies = {
    "administratorAccess": aws.iam.AdministratorAccess,
};
const infrastructureManagementRole = newRoleWithPolicies("infrastructureRole", {
    description: "Infrastructure management role for CI users",
    assumeRolePolicy: assumeRolePolicy,
}, infraPolicies);
export const infrastructureManagementRoleArn = infrastructureManagementRole.arn;

// Create an IAM role with appropriate permissions for k8s application development
const appPolicies = {
    "ecrPowerUser": aws.iam.AmazonEC2ContainerRegistryPowerUser,
};
const applicationManagementRole = newRoleWithPolicies("applicationRole", {
    description: "Application management role for CI users",
    assumeRolePolicy: assumeRolePolicy,
}, appPolicies);
export const applicationManagementRoleArn = applicationManagementRole.arn;
