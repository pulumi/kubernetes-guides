import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { config } from "./config";

const projectName = pulumi.getProject();
const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
});
export const appsNamespaceName = config.appsNamespaceName

// Deploy NGINX ingress controller using the Helm chart.
const nginx = new k8s.helm.v2.Chart("nginx",
    {
        namespace: config.appSvcsNamespaceName,
        chart: "nginx-ingress",
        version: "1.24.4",
        fetchOpts: {repo: "https://kubernetes-charts.storage.googleapis.com/"},
        values: {controller: {publishService: {enabled: true}}},
        transformations: [
            (obj: any) => {
                // Do transformations on the YAML to set the namespace
                if (obj.metadata) {
                    obj.metadata.namespace = config.appSvcsNamespaceName;
                }
            },
        ],
    },
    {providers: {kubernetes: provider}},
);

// Create a kuard Deployment
const name = "kuard"
const labels = {app: name}
const deployment = new k8s.apps.v1.Deployment(name,
    {
        metadata: {
            namespace: config.appsNamespaceName,
            labels: {app: name},
        },
        spec: {
            replicas: 1,
            selector: { matchLabels: labels },
            template: {
                metadata: { labels: labels, },
                spec: {
                    containers: [
                        {
                            name: name,
                            image: "gcr.io/kuar-demo/kuard-amd64:blue",
                            resources: {requests: {cpu: "50m", memory: "20Mi"}},
                            ports: [{ name: "http", containerPort: 8080 }]
                        }
                    ],
                }
            }
        },
    },
    {provider: provider}
);

// Create a Service for the kuard Deployment
const service = new k8s.core.v1.Service(name,
    {
        metadata: {labels: labels, namespace: config.appsNamespaceName},
        spec: {ports: [{ port: 8080, targetPort: "http" }], selector: labels},
    },
    {provider: provider}
);

// Export the Service name and public LoadBalancer endpoint
export const serviceName = service.metadata.name;

// Create the kuard Ingress
const ingress = new k8s.extensions.v1beta1.Ingress(name,
    {
        metadata: {
            labels: labels,
            namespace: config.appsNamespaceName,
            annotations: {"kubernetes.io/ingress.class": "nginx"},
        },
        spec: {
            rules: [
                {
                    host: "apps.example.com",
                    http: {
                        paths: [
                            {
                                path: "/",
                                backend: {
                                    serviceName: serviceName,
                                    servicePort: "http",
                                }
                            },
                        ],
                    },
                }
            ]
        }
    },
    {provider: provider}
);
