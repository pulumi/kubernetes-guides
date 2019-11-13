[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new)

# NGINX Ingress Controller

A Deployment of the [NGINX Ingress Controller][k8s-nginx].

[k8s-nginx]: https://github.com/kubernetes/ingress-nginx

## Deploying the App

To deploy your infrastructure, follow the below steps.

### Prerequisites

1. [Get Started with Kubernetes on Pulumi](https://www.pulumi.com/docs/get-started/kubernetes/)

### Steps

After cloning this repo, from this working directory, run these commands:

1. Install the required Node.js packages:

    ```bash
    $ npm install
    ```

1. Create a new stack, which is an isolated deployment target for this example:

    ```bash
    $ pulumi stack init
    ```

1. Configure the stack.

    ```bash
    $ pulumi stack init
    $ pulumi config set k8s-aws-apps-svcs-nginx:infraStackRef myUser/k8s-<cloud>-infra/dev-1573589378
    $ pulumi config set k8s-aws-apps-svcs-nginx:clusterStackRef myUser/k8s-<cloud>-cluster/dev-1571780002
    ```

1. Update the stack.

    ```bash
    $ pulumi up
    ```
   
1. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

    ```bash
    $ pulumi destroy --yes
    $ pulumi stack rm --yes
    ```
