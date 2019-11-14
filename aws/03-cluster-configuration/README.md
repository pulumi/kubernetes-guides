[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new)

# Cluster Configuration - AWS

Create the EKS Cluster and Kubernetes Defaults.

Check out the [Crosswalk Guide](https://www.pulumi.com/docs/guides/crosswalk/kubernetes/control-plane)
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

1.  Collect any stack configuration references to configure the stack in the
    next step.

    To get the Pulumi Stack Reference of a dependent stack, reference it in the
    config using the format: `<org_or_username>/<project>/<stack>` e.g. `myUser/myProject/dev01`

    You can retrieve the Stack's reference name by running `pulumi stack ls` in
    the stack, and extracting it's stack URI.

    The stack reference for the example below is: `myUser/k8s-aws-identity/dev-1573587501`

    ```bash
    user@pulumi:~/pulumi/kubernetes-guides/aws/01-identity$ pul stack ls
    NAME             LAST UPDATE    RESOURCE COUNT  URL
    dev-1573587501*  4 minutes ago  13              https://app.pulumi.com/myUser/k8s-aws-identity/dev-1573587501
    ```

1. Configure the stack.

    ```bash
    $ pulumi config set aws:region us-west-2
    $ pulumi config set k8s-aws-cluster:identityStackRef myUser/k8s-aws-identity/dev-1573589109
    $ pulumi config set k8s-aws-cluster:infraStackRef myUser/k8s-aws-infra/dev-1573589378
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
