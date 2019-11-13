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

//
// Global statics.
//

export const groupName = "awsProd";

//
// Policy helpers.
//

export type Policies = { [name: string]: pulumi.Input<aws.ARN> };

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
