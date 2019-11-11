// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import { config } from "./config";

const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
    namespace: config.appsNamespaceName,
});

// Create an example Job.
const exampleJob = new k8s.batch.v1.Job("example-job", {
    spec: {
        template: {
            spec: {
                containers: [
                    {
                        name: "pi",
                        image: "perl",
                        command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"],
                    }
                ],
                restartPolicy: "Never"
            }
        },
    }
}, { provider: provider });

//
// Example using kx.
//

// Define the Pod for the Job.
const pb = new kx.PodBuilder({
    containers: [{
        name: "pi",
        image: "perl",
        command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"],
    }],
    restartPolicy: "Never",
});

// Create an example Job using the Pod defined by the PodBuilder.
const exampleJobKx = new kx.Job("example-job-kx", {
    spec: pb.asJobSpec(),
}, { provider: provider });
