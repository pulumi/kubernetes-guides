# Kubernetes Guides

[Pulumi Crosswalk for Kubernetes][crosswalk-k8s] is a collection of industry standard
best-practices for managing Kubernetes, and its infrastructure in production.

This guide is for provisioning and configuring production-grade Kubernetes
clusters, and deploying workloads into the clusters.

If you are just getting started with Pulumi and Kubernetes, the
[Get Started][k8s-get-started] guide is a better place to start.

<img src="images/cake.svg">

The cloud provider stacks to deploy.

| AWS  | Azure  | GCP  |
|---|---|---|
| [Identity](./aws/01-identity) | [Identity](./azure/01-identity) | [Identity](./gcp/01-identity) |
| [Managed Infrastructure](./aws/02-managed-infra) | [Managed Infrastructure](./azure/02-managed-infra) | [Managed Infrastructure](./gcp/02-managed-infra) |
| [Cluster Configuration](./aws/03-cluster-configuration) | [Cluster Configuration](./azure/03-cluster-configuration) | [Cluster Configuration](./gcp/03-cluster-configuration) |
| [Deploy Cluster Services](./aws/04-cluster-services) | [Deploy Cluster Services](./azure/04-cluster-services) | [Deploy Cluster Services](./gcp/04-cluster-services) |
| [Deploy App Services](./aws/05-app-services) | [Deploy App Services](./azure/05-app-services) | [Deploy App Services](./gcp/05-app-services) |
| [Deploy Apps](./aws/06-apps) | [Deploy Apps](./azure/06-apps) | [Deploy Apps](./gcp/06-apps) |

The Kubernetes stacks that can be deployed on all clouds:

  * [General Cluster Services](./general-cluster-services)
  * [General App Services](./general-app-services)
  * [Apps](./apps)

[crosswalk-k8s]: https://pulumi.com/docs/guides/crosswalk/kubernetes
[k8s-get-started]: https://pulumi.com/docs/get-started/kubernetes
