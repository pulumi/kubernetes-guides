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

import * as pulumi from "@pulumi/pulumi";

import * as common from "./common";
import * as groups from "./groups";
import * as policies from "./policies";

export type BaselineIamOptions = {
    policies?: policies.BaselineIamPoliciesOptions;
    groups?: groups.BaselineIamGroupsOptions;
};

export class BaselineIam extends pulumi.ComponentResource {
    public readonly policies: policies.BaselineIamPolicies;
    public readonly groups: groups.BaselineIamGroups;

    constructor(
        name: string,
        args: BaselineIamOptions = {},
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super(`${common.groupName}:index:BaselineIam`, name, args, opts);

        const defineIamPassPolicy = args.policies && args.policies.defineUseExistingIamRolesPolicy;
        let defineIamPassGroup = args.groups && args.groups.defineUseExistingIamRolesGroup;
        defineIamPassGroup = defineIamPassGroup === undefined ? true : defineIamPassGroup;

        if (defineIamPassGroup === true && defineIamPassPolicy === false) {
            throw Error(
                "'defineUseExistingIamRolesGroup' can't be true when 'defineUseExistingIamRolesPolicy' is false",
            );
        }

        if (defineIamPassGroup === true) {
            args.policies = args.policies === undefined ? {} : args.policies;
            args.policies.defineUseExistingIamRolesPolicy = true;
        }

        this.policies = new policies.BaselineIamPolicies(name, args.policies, { parent: this });

        const groupsArgs = {
            ...args.groups,
            useExistingIamRolesPolicy: this.policies.useExistingIamRoles,
        };
        this.groups = new groups.BaselineIamGroups(name, groupsArgs, { parent: this });
    }
}
