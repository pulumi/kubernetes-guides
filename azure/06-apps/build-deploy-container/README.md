[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new?template=https://github.com/pulumi/kubernetes-guides/blob/master/azure/06-apps/build-deploy-container/README.md)

# Build container image and push to private registry on Azure

This example builds a container image of a simple Node app and pushes the image
to a private registry on Azure. The image is used to create a Kubernetes
Deployment.

## Deploying the App

To deploy your infrastructure, follow the below steps.

### Prerequisites

1. [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
1. [Install Node.js 8.11.3](https://nodejs.org/en/download/)
1. [Install Docker](https://docs.docker.com/v17.09/engine/installation/)
1. [Configure Azure Credentials](https://www.pulumi.com/docs/intro/cloud-providers/azure/setup/)
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

3. Set the required configuration variables for this program:

    ```bash
    $ pulumi config set azure:location westus2              # Any valid Azure location here.
    ```
   
   Note that you can choose different regions here.

4. Bring up the stack, which will create the cloud resources, build and push the image to the private registry,
and then create a Deployment using that image.

    ```bash
    $ pulumi up
    ```
   
5. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

    ```bash
    $ pulumi destroy --yes
    $ pulumi stack rm --yes
    ```
