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

// ------------------------------------------------------------------------------------------------
// NOTE: Remove the `User` class below when it ships as part of the AWS/x packages.
// ------------------------------------------------------------------------------------------------

class User extends pulumi.ComponentResource {
    public readonly user: aws.iam.User;
    public readonly accessKeys: aws.iam.AccessKey[];
    public readonly groupMemberships: aws.iam.UserGroupMembership[];

    constructor(name: string, args: UserArgs = {}, opts?: pulumi.CustomResourceOptions) {
        super(`awsinfra:x:iam:User`, name, args, opts);

        // Save group membership and access key args so we can define them inline.
        const groupMembership = args.groupMembership;

        // Explicitly delete these props so we do *not* pass them into the User created
        // below.
        delete args.groupMembership;

        this.user = args.user || new aws.iam.User(name, args, { parent: this });

        this.accessKeys = [];

        this.groupMemberships = [];
        if (groupMembership !== undefined) {
            this.groupMemberships.push(
                new aws.iam.UserGroupMembership(
                    name,
                    { ...groupMembership, user: this.user.name },
                    { parent: this },
                ),
            );
        }
    }

    /**
     * Create an AccessKey for the current `User`.
     *
     * @param name The _unique_ name of the resulting `AccessKey` resource.
     * @param args The properties of the resulting `AccessKey` resource.
     * @param opts A bag of options that control the resulting `AccessKey` resource's behavior.
     * __NOTE__: the `parent` field is overridden and set to `this`, rather than the value (if any)
     * in `opts`.
     */
    public createAccessKey(
        name: string,
        args?: AccessKeyArgs,
        opts?: pulumi.CustomResourceOptions,
    ): aws.iam.AccessKey {
        const key = new aws.iam.AccessKey(
            name,
            { ...args, user: this.user.name },
            { ...opts, parent: this },
        );
        this.accessKeys.push(key);
        return key;
    }

    /**
     * Add the current `User` to an arbitrary set of IAM Groups, returning the resulting
     * `UserGroupMembership` resources.
     *
     * @param name The _unique_ name of the resulting `UserGroupMembership` resource.
     * @param args The properties of the resulting `UserGroupMembership` resource.
     * @param opts A bag of options that control the resulting `UserGroupMembership` resource's
     * behavior. __NOTE__: the `parent` field is overridden and set to `this`, rather than the value
     * (if any) in `opts`.
     */
    public addToGroups(
        name: string,
        args: UserGroupMembershipArgs,
        opts?: pulumi.CustomResourceOptions,
    ): aws.iam.UserGroupMembership {
        const membership = new aws.iam.UserGroupMembership(
            name,
            { ...args, user: this.user.name },
            { ...opts, parent: this },
        );
        this.groupMemberships.push(membership);
        return membership;
    }

    public static fromExistingId(
        name: string,
        id: pulumi.Input<string>,
        args: UserArgs = {},
        opts: pulumi.ComponentResourceOptions = {},
    ) {
        return new User(name, { ...args, user: aws.iam.User.get(name, id, {}, opts) }, opts);
    }
}

export type AccessKeyArgs = Pick<
    aws.iam.AccessKeyArgs,
    Exclude<keyof aws.iam.AccessKeyArgs, "user">
>;

export type UserGroupMembershipArgs = Pick<
    aws.iam.UserGroupMembershipArgs,
    Exclude<keyof aws.iam.UserGroupMembershipArgs, "user">
>;

export type UserArgs = aws.iam.UserArgs & {
    groupMembership?: UserGroupMembershipArgs;
    user?: aws.iam.User;
};

/**
 * EmployeeUser represents an AWS IAM User that is a full-time employee. Because it is useful to
 * quickly distinguish between various types of users, all EmployeeUsers are allocated names of the
 * form `employee.${name}`.
 */
export class EmployeeUser extends User {
    /**
     * Create a EmployeeUser resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource. This name will be transformed into the form
     * `employee.${name}`.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: UserArgs, opts?: pulumi.CustomResourceOptions) {
        super(`employee.${name}`, args, opts);
    }
}

/**
 * ContractorUser represents an AWS IAM User that is a contracting employee. Because it is useful to
 * quickly distinguish between various types of users, all ContractorUsers are allocated names of
 * the form `contractor.${name}`.
 */
export class ContractorUser extends User {
    /**
     * Create a ContractorUser resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource. This name will be transformed into the form
     * `contractor.${name}`.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: UserArgs, opts?: pulumi.CustomResourceOptions) {
        super(`contractor.${name}`, args, opts);
    }
}

/**
 * BotUser represents an AWS IAM User that is a bot, such as a CI system. Because it is useful to
 * quickly distinguish between various types of users, all BotUsers are allocated names of the form
 * `bot.${name}`.
 */
export class BotUser extends User {
    /**
     * Create a BotUser resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource. This name will be transformed into the form
     * `bot.${name}`.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: UserArgs, opts?: pulumi.CustomResourceOptions) {
        super(`bot.${name}`, args, opts);
    }
}

export type Policies = { [name: string]: pulumi.Input<aws.ARN> };

// Helper function that creates a new IAM Role and attaches the specified policies.
export function newRoleWithPolicies(
    name: string,
    args: aws.iam.RoleArgs,
    policies: Policies,
): aws.iam.Role {
    const role = new aws.iam.Role(name, args);
    for (const policy of Object.keys(policies)) {
        // Create RolePolicyAttachment without returning it.
        // tslint:disable:no-unused-expression
        new aws.iam.RolePolicyAttachment(
            `${name}-${policy}`,
            { policyArn: policies[policy], role },
            { parent: role },
        );
    }
    return role;
}

export function assumeRolePolicy(user: aws.ARN): aws.iam.PolicyDocument {
    return {
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: { AWS: [user] },
                Action: "sts:AssumeRole",
            },
        ],
    };
}
