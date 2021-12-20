[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new?template=https://github.com/pulumi/kubernetes-guides/blob/master/general-cluster-services/datadog-daemonset/README.md)

# DataDog DaemonSet

A DaemonSet that deploys DataDog on all nodes.

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

2. Create a new stack, which is an isolated deployment target for this example:

    ```bash
    $ pulumi stack init
    ```

1. Configure the stack.

    ```bash
    $ pulumi config set k8s-apps-daemonset-datadog:clusterStackRef myUser/k8s-<cloud>-cluster/dev-1571780002
    $ pulumi config set k8s-apps-daemonset-datadog:datadogApiKey 00000000111111111222222222333333
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
