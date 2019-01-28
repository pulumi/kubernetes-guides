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
import * as pulumi from "@pulumi/pulumi";
import * as common from "./common";

//
// NOTE: These groups are largely intended to closely mirror the official AWS guidance[1] on how to
// create policies for organizations.
//
// [1]: https://aws.amazon.com/blogs/security/how-to-assign-permissions-using-new-aws-managed-policies-for-job-functions/
//

// NOTE: `foo?: Bar` is not equivalent to `foo: Bar | undefined` class members. The former indicates
// that the field is optional on the class, while the latter requires that it exists on the class,
// and has a field that is `Bar | undefined`.
type IBaselineIamGroups = {
    [Group in
        | "admins"
        | "networkAdmins"
        | "billing"
        | "securityAuditors"
        | "readOnly"
        | "useExistingIamRoles"
        | "eksAdmins"
        | "support"
        // | "engineering"
        | "dataScientists"
        | "devPowerUsers"
        | "databaseAdmins"
        | "sysAdmins"]: aws.iam.Group | undefined
};

export type BaselineGroupArgs = Pick<aws.iam.GroupArgs, Exclude<keyof aws.iam.GroupArgs, "groups">>;

export type InternalBaselineIamGroupOptions =  // IAM Groups created by default.
    | "defineAdminsGroup"
    | "defineNetworkAdminsGroup"
    | "defineDatabaseAdminsGroup"
    | "defineBillingGroup"
    | "defineSecurityAuditorsGroup"
    | "defineReadOnlyGroup"
    // NOTE: "defineUseExistingIamRolesGroup" is handled by passing `useExistingIamRolesPolicy` in
    // the `BaselineIamGroups` constructor below.

    // IAM Groups NOT created by default.
    | "defineEksAdminsGroup"
    | "defineSupportGroup"
    | "defineDataScientistsGroup"
    | "defineDevPowerUsersGroup"
    | "defineSysAdminsGroup";

export type BaselineIamGroupsOptions = {
    [GroupCreateOption in InternalBaselineIamGroupOptions | "defineUseExistingIamRolesGroup"]?:
        | boolean
        | aws.iam.GroupArgs
};

export class BaselineIamGroups extends pulumi.ComponentResource implements IBaselineIamGroups {
    public readonly admins: aws.iam.Group | undefined;
    public readonly networkAdmins: aws.iam.Group | undefined;
    public readonly databaseAdmins: aws.iam.Group | undefined;
    public readonly billing: aws.iam.Group | undefined;
    public readonly securityAuditors: aws.iam.Group | undefined;
    public readonly readOnly: aws.iam.Group | undefined;
    public readonly useExistingIamRoles: aws.iam.Group | undefined;
    public readonly eksAdmins: aws.iam.Group | undefined;
    public readonly support: aws.iam.Group | undefined;
    public readonly dataScientists: aws.iam.Group | undefined;
    public readonly devPowerUsers: aws.iam.Group | undefined;
    public readonly sysAdmins: aws.iam.Group | undefined;

    constructor(
        name: string,
        args: {
            [GroupCreateOption in InternalBaselineIamGroupOptions]?: boolean | aws.iam.GroupArgs
        } & {
            useExistingIamRolesPolicy?: aws.iam.Policy;
        } = {},
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super(`${common.groupName}:index:BaselineIamGroups`, name, args, opts);

        //
        // IAM Groups that we create by default.
        //

        args.defineAdminsGroup =
            args.defineAdminsGroup === undefined ? true : args.defineAdminsGroup;
        args.defineNetworkAdminsGroup =
            args.defineNetworkAdminsGroup === undefined ? true : args.defineNetworkAdminsGroup;
        args.defineDatabaseAdminsGroup =
            args.defineDatabaseAdminsGroup === undefined ? true : args.defineDatabaseAdminsGroup;
        args.defineBillingGroup =
            args.defineBillingGroup === undefined ? true : args.defineBillingGroup;
        args.defineSecurityAuditorsGroup =
            args.defineSecurityAuditorsGroup === undefined
                ? true
                : args.defineSecurityAuditorsGroup;
        args.defineReadOnlyGroup =
            args.defineReadOnlyGroup === undefined ? true : args.defineReadOnlyGroup;

        //
        // Administrators.
        //

        this.admins = this.defineGroup(args.defineAdminsGroup, "admins", {
            administratorAccess: aws.iam.AdministratorAccess,
        });

        this.networkAdmins = this.defineGroup(args.defineNetworkAdminsGroup, "networkAdmins", {
            networkAdministrator: aws.iam.NetworkAdministrator,
        });

        this.databaseAdmins = this.defineGroup(args.defineDatabaseAdminsGroup, "databaseAdmins", {
            databaseAdministrator: aws.iam.DatabaseAdministrator,
        });

        this.eksAdmins = this.defineGroup(args.defineEksAdminsGroup, "eksAdmins", {
            administratorAccess: aws.iam.AdministratorAccess,
        });

        //
        // Billing and auditing.
        //

        this.billing = this.defineGroup(args.defineBillingGroup, "billing", {
            billing: aws.iam.Billing,
        });

        this.securityAuditors = this.defineGroup(
            args.defineSecurityAuditorsGroup,
            "securityAuditors",
            { securityAudit: aws.iam.SecurityAudit },
        );

        //
        // Support, read-only, IAM-passing, and non-administrator roles.
        //

        this.readOnly = this.defineGroup(args.defineReadOnlyGroup, "readOnly", {
            readOnly: aws.iam.ViewOnlyAccess,
        });

        const passArn = args.useExistingIamRolesPolicy && args.useExistingIamRolesPolicy.arn;
        this.useExistingIamRoles =
            passArn &&
            this.defineGroup(args.useExistingIamRolesPolicy !== undefined, "useExistingIamRoles", {
                useExistingIamRoles: passArn,
            });

        this.support = this.defineGroup(args.defineSupportGroup, "support", {
            supportUser: aws.iam.SupportUser,
        });

        //
        // Engineering departments.
        //

        this.dataScientists = this.defineGroup(args.defineDataScientistsGroup, "dataScientists", {
            dataScientist: aws.iam.DataScientist,
        });

        this.devPowerUsers = this.defineGroup(
            args.defineDevPowerUsersGroup,
            "developerPowerUsers",
            { powerUserAccess: aws.iam.PowerUserAccess },
        );

        this.sysAdmins = this.defineGroup(args.defineSysAdminsGroup, "systemAdmins", {
            systemAdministrator: aws.iam.SystemAdministrator,
        });
    }

    public groups(): { [key: string]: aws.iam.Group } {
        const groups: any = {};
        for (const key in this) {
            if (!this.hasOwnProperty(key) || this[key] === undefined) {
                continue;
            }
            const group = this[key];
            groups[key] = group;
        }
        return groups;
    }

    public arns(): { [key: string]: pulumi.Output<aws.ARN> } {
        const arns: any = {};
        const groups = this.groups();
        for (const key of Object.keys(groups)) {
            arns[key] = groups[key].arn;
        }
        return arns;
    }

    private defineGroup(
        defineOpt: boolean | BaselineGroupArgs | undefined,
        name: string,
        policies: common.Policies,
    ): aws.iam.Group | undefined {
        let group = undefined;
        let groupArgs: BaselineGroupArgs = { path: "/users/" };

        if (defineOpt === false || defineOpt === undefined) {
            return;
        } else if (defineOpt !== true) {
            groupArgs = defineOpt;
        }

        group = new aws.iam.Group(name, groupArgs, { parent: this });
        for (const policy of Object.keys(policies)) {
            // Create GroupPolicyAttachment without returning it.
            // tslint:disable:no-unused-expression
            new aws.iam.GroupPolicyAttachment(
                `${name}-${policy}`,
                { policyArn: policies[policy], group },
                { parent: group },
            );

            //
            // TODO: Create policy for this
            //

            // // Grant every user the ability to manage their own credentials (e.g., reset passwords, etc.)
            // new aws.iam.GroupPolicyAttachment(
            //     `${name}-iamSelfManage`,
            //     { policyArn: aws.iam.IAMSelfManageServiceSpecificCredentials, group },
            //     { parent: group }
            // );
        }

        return group;
    }
}
