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

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export function bindToRole(
    name: string,
    sa: gcp.serviceAccount.Account,
    args: { project: pulumi.Input<string>; roles: string[]})
{
    args.roles.forEach((role, index) => {
        new gcp.projects.IAMMember(`${name}-${index}`, {
            project: args.project,
            role: role,
            member: sa.email.apply(email => `serviceAccount:${email}`),
        });
    })
}

export function createServiceAccountKey(name: string, sa: gcp.serviceAccount.Account): gcp.serviceAccount.Key {
    return new gcp.serviceAccount.Key(name, { serviceAccountId: sa.name });
}

export function clientSecret(key: gcp.serviceAccount.Key): pulumi.Output<any> {
    return key.privateKey.apply(key => JSON.parse(Buffer.from(key, "base64").toString("ascii")));
}
