// Copyright 2016-2019, Pulumi Corporation.
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
import * as pulumi from "@pulumi/pulumi";
import * as common from "./common";

type IamPolicyDocuments = "eksAdmins" | "useExistingIamRoles";

export const baselineIamPolicyDocuments: {
    [PolicyDocument in IamPolicyDocuments]: aws.iam.PolicyDocument
} = {
    eksAdmins: {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: ["eks:*", "ec2:DescribeImages"], Resource: "*" }],
    },
    useExistingIamRoles: {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "iam:PassRole", Resource: "*" }],
    },
};

// NOTE: `foo?: Bar` is not equivalent to `foo: Bar | undefined` class members. The former indicates
// that the field is optional on the class, while the latter requires that it exists on the class,
// and has a field that is `Bar | undefined`.
type IBaselineIamPolicies = { [PolicyDocument in IamPolicyDocuments]: aws.iam.Policy | undefined };

export type BaselinePolicyArgs = Pick<
    aws.iam.AccessKeyArgs,
    Exclude<keyof aws.iam.AccessKeyArgs, "policy">
>;

export type BaselineIamPoliciesOptions = {
    [PolicyCreateOption in "defineEksAdminsPolicy" | "defineUseExistingIamRolesPolicy"]?:
        | boolean
        | BaselinePolicyArgs
};

export class BaselineIamPolicies extends pulumi.ComponentResource implements IBaselineIamPolicies {
    public readonly eksAdmins: aws.iam.Policy | undefined;
    public readonly useExistingIamRoles: aws.iam.Policy | undefined;

    constructor(
        name: string,
        args?: BaselineIamPoliciesOptions,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super(`${common.groupName}:index:BaselineIamPolicies`, name, args, opts);

        args = args === undefined ? {} : args;

        //
        // IAM Policies that we create by default.
        //

        args.defineUseExistingIamRolesPolicy =
            args.defineUseExistingIamRolesPolicy === undefined
                ? true
                : args.defineUseExistingIamRolesPolicy;

        //
        // Define IAM Policies.
        //

        this.eksAdmins = this.definePolicy(args.defineEksAdminsPolicy, "eksAdmins", {
            description: "Administrative access for EKS clusters",
            policy: JSON.stringify(baselineIamPolicyDocuments.eksAdmins),
        });

        this.useExistingIamRoles = this.definePolicy(
            args.defineUseExistingIamRolesPolicy,
            "iamPass",
            {
                description:
                    "Allows IAM Users to attach or modify existing IAM Roles to AWS resources",
                policy: JSON.stringify(baselineIamPolicyDocuments.useExistingIamRoles),
            },
        );
    }

    public policies(): { [key: string]: aws.iam.Policy } {
        const policies: any = {};
        for (const key in this) {
            if (!this.hasOwnProperty(key) || this[key] === undefined) {
                continue;
            }
            const policy = this[key];
            policies[key] = policy;
        }
        return policies;
    }

    public arns(): { [key: string]: pulumi.Output<aws.ARN> } {
        const arns: any = {};
        const policies = this.policies();
        for (const key of Object.keys(policies)) {
            arns[key] = policies[key].arn;
        }
        return arns;
    }

    private definePolicy(
        defineOpt: boolean | BaselinePolicyArgs | undefined,
        name: string,
        args: aws.iam.PolicyArgs,
    ): aws.iam.Policy | undefined {
        let policyArgs: aws.iam.PolicyArgs = args;

        if (defineOpt === false || defineOpt === undefined) {
            return undefined;
        } else if (defineOpt !== true) {
            policyArgs = { ...policyArgs, ...defineOpt };
        }

        return new aws.iam.Policy(name, policyArgs, { parent: this });
    }
}
