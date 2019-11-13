[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new)

# Managed Infrastructure - AWS

Create the Managed Infrastructure resources to deploy EKS.

Check out the [Crosswalk Guide](https://www.pulumi.com/docs/guides/crosswalk/kubernetes/managed-infra)
on this stack for more details.

## Deploying the Stack

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
    $ pulumi config set aws:region us-west-2
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
