// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
import { config } from "./config";

const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appsNamespaceName,
});

// Create an example CronJob.
const exampleCronJob = new k8s.batch.v1beta1.CronJob("example-cronjob", {
    spec: {
        schedule: "*/1 * * * *",
        jobTemplate: {
            spec: {
                template: {
                    spec: {
                        containers: [
                            {
                                name: "hello",
                                image: "busybox",
                                args: ["/bin/sh",  "-c", "date; echo Hello from the Kubernetes cluster"],
                            }
                        ],
                        restartPolicy: "OnFailure"
                    }
                }
            }
        },
    }
}, { provider: provider });
