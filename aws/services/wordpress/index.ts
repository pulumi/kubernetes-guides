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

import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

import * as config from "./config";

// Deploy the latest version of the stable/wordpress chart.
const wordpress = new k8s.helm.v2.Chart(
    "wpdev",
    {
        repo: "stable",
        version: "2.1.3",
        chart: "wordpress"
    },
    { providers: { kubernetes: config.k8sProvider } }
);

// Export the public endpoit for Wordpress.
export const frontend = wordpress
    .getResourceProperty("v1/Service", "wpdev-wordpress", "status")
    .apply(status => status.loadBalancer.ingress[0].hostname);
