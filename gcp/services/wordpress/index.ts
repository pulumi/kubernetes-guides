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

// Export the public IP for Wordpress.
export const frontendIp = wordpress
    .getResourceProperty("v1/Service", "wpdev-wordpress", "status")
    .apply(status => status.loadBalancer.ingress[0].ip);
