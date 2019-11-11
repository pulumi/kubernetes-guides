// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
import { config } from "./config";

const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appsNamespaceName,
});

// Create an example Pod with a Sidecar.
const pod = new k8s.core.v1.Pod("example", {
    spec: {
        restartPolicy: "Never",
        volumes: [
            {name: "shared-data", emptyDir: {}},
        ],
        containers: [
            {
                name: "nginx",
                image: "nginx",
                resources: {requests: {cpu: "50m", memory: "50Mi"}},
                volumeMounts: [
                    { name: "shared-data", mountPath: "/usr/share/nginx/html"},
                ],
            },
            {
                name: "debian-container",
                image: "debian",
                resources: {requests: {cpu: "50m", memory: "50Mi"}},
                volumeMounts: [
                    { name: "shared-data", mountPath: "/pod-data"},
                ],
                command: [ "/bin/bash"],
                args: ["-c", "echo Hello from the Debian container > /pod-data/index.html ; sleep infinity"],
            }
        ],
    }
}, { provider: provider });
