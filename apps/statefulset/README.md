[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new)

# StatefulSet

This example deploys MariaDB as a StatefulSet.

## Deploying the App

To deploy your infrastructure, follow the below steps.

### Prerequisites

1. [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
1. [Install Node.js 8.11.3](https://nodejs.org/en/download/)
1. [Configure access to a Kubernetes cluster](https://kubernetes.io/docs/setup/)

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

3. Bring up the stack, which create all of the resources required to run wordpress.

    ```bash
    $ pulumi up
    ```
   
4. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

    ```bash
    $ pulumi destroy --yes
    $ pulumi stack rm --yes
    ```
