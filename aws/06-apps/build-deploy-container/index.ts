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

import * as awsx from "@pulumi/awsx";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { config } from "./config";

// Create a repository.
const repo = new awsx.ecr.Repository("my-repo");

// Build a Docker image from a local Dockerfile context in the
// './node-app' directory, and push it to the registry.
const customImage = "node-app";
const appImage = repo.buildAndPushImage(`./${customImage}`);

// Create a k8s provider.
const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appsNamespaceName,
});

// Create a Deployment of the built container.
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
                    image: appImage,
                    ports: [{name: "http", containerPort: 80}],
                }],
            }
        },
    }
}, { provider: provider });

//
// Example using kx.
//

// Define the Pod for the Deployment.
const pb = new kx.PodBuilder({
    containers: [{
        image: appImage,
        ports: { "http": 80 },
    }],
});

// Create a Deployment of the Pod defined by the PodBuilder.
const appDeploymentKx = new kx.Deployment("app-kx", {
    spec: pb.asDeploymentSpec(),
}, { provider: provider });
