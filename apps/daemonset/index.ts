// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
import { config } from "./config";

const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appsNamespaceName,
});

// Create a DaemonSet that deploys nginx to each worker node.
const appName = "nginx";
const appLabels = { app: appName };
const nginx = new k8s.apps.v1.DaemonSet(appName, {
    metadata: { labels: appLabels },
    spec: {
        selector: {
            matchLabels: appLabels,
        },
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [
                    {
                        image: "nginx",
                        name: "nginx",
                    },
                ],
            },
        },
    },
}, { provider: provider });
