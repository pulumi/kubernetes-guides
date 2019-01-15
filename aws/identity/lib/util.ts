import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

//
// User types.
//

// EmployeeUser represents an AWS IAM User that is a full-time employee.
export class EmployeeUser extends aws.iam.User {
    /**
     * Create a EmployeeUser resource with the given unique name, arguments, and options.
     *
     * Because it is useful to quickly distinguish between various types of users, all EmployeeUsers
     * are allocated names of the form `employee.${name}`.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: aws.iam.UserArgs, opts?: pulumi.CustomResourceOptions) {
        super(`employee.${name}`, args, opts);
    }
}

// ContractorUser represents an AWS IAM User that is a contracting employee.
export class ContractorUser extends aws.iam.User {
    /**
     * Create a ContractorUser resource with the given unique name, arguments, and options.
     *
     * Because it is useful to quickly distinguish between various types of users, all
     * ContractorUsers are allocated names of the form `contractor.${name}`.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: aws.iam.UserArgs, opts?: pulumi.CustomResourceOptions) {
        super(`contractor.${name}`, args, opts);
    }
}

// BotUser represents an AWS IAM User that is a bot, such as a CI system.
export class BotUser extends aws.iam.User {
    /**
     * Create a BotUser resource with the given unique name, arguments, and options.
     *
     * Because it is useful to quickly distinguish between various types of users, all BotUsers are
     * allocated names of the form `bot.${name}`.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: aws.iam.UserArgs, opts?: pulumi.CustomResourceOptions) {
        super(`bot.${name}`, args, opts);
    }
}

//
// Policy helpers.
//

export type Policies = { [name: string]: pulumi.Input<aws.ARN> };

// Helper function that creates a new IAM Group and attaches the specified policies.
export function newUserGroupWithPolicies(name: string, policies: Policies): aws.iam.Group {
    const group = new aws.iam.Group(name, { path: "/users/" });
    for (const policy of Object.keys(policies)) {
        // Create GroupPolicyAttachment without returning it.
        new aws.iam.GroupPolicyAttachment(
            `${name}-${policy}`,
            { policyArn: policies[policy], group },
            { parent: group }
        );
    }

    //
    // TODO: Create policy for this
    //

    // // Grant every user the ability to manage their own credentials (e.g., reset passwords, etc.)
    // new aws.iam.GroupPolicyAttachment(
    //     `${name}-iamSelfManage`,
    //     { policyArn: aws.iam.IAMSelfManageServiceSpecificCredentials, group },
    //     { parent: group }
    // );

    return group;
}

// Helper function that creates a new IAM Role and attaches the specified policies.
export function newRoleWithPolicies(
    name: string,
    args: aws.iam.RoleArgs,
    policies: Policies
): aws.iam.Role {
    const role = new aws.iam.Role(name, args);
    for (const policy of Object.keys(policies)) {
        // Create RolePolicyAttachment without returning it.
        new aws.iam.RolePolicyAttachment(
            `${name}-${policy}`,
            { policyArn: policies[policy], role },
            { parent: role }
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
                Action: "sts:AssumeRole"
            }
        ]
    };
}
