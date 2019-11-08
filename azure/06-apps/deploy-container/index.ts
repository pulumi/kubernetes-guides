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

import * as azure from "@pulumi/azure";
import * as docker from "@pulumi/docker";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { config } from "./config";

// Create an Azure Resource Group
const resourceGroup = new azure.core.ResourceGroup("samples");

const registry = new azure.containerservice.Registry("myregistry", {
    resourceGroupName: resourceGroup.name,
    sku: "Basic",
    adminEnabled: true,
});

const customImage = "node-app";
const appImage = new docker.Image(customImage, {
    imageName: pulumi.interpolate`${registry.loginServer}/${customImage}:v1.0.0`,
    build: {
        context: `./${customImage}`,
    },
    registry: {
        server: registry.loginServer,
        username: registry.adminUsername,
        password: registry.adminPassword,
    },
});

const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appsNamespaceName,
});

const appLabels = { app: customImage };
const appDeployment = new k8s.apps.v1.Deployment("app", {
    spec: {
        selector: { matchLabels: appLabels },
        replicas: 1,
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: customImage,
                    image: appImage.imageName,
                    ports: [{name: "http", containerPort: 80}],
                }],
            }
        },
    }
}, { provider: provider });
