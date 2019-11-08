[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new)

# Build container image and push to private registry on GCP

This example builds a container image of a simple Node app and pushes the image
to a private registry on GCP. The image is used to create a Kubernetes
Deployment.

## Deploying the App

To deploy your infrastructure, follow the below steps.

### Prerequisites

1. [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
1. [Install Node.js 8.11.3](https://nodejs.org/en/download/)
1. [Install Docker](https://docs.docker.com/v17.09/engine/installation/)
1. [Configure GCP Credentials](https://www.pulumi.com/docs/intro/cloud-providers/gcp/setup/)
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
    $ pulumi config set gcp:project [your-gcp-project-here]
    $ pulumi config set gcp:zone us-west1-a                 # Any valid GCP zone here.
    ```
   
   Note that you can choose different zones here.

4. Run the following command to authorize Docker to push to the GCR registry:

    ```bash
    $ gcloud auth configure-docker 
    ```

5. Bring up the stack, which will create the cloud resources, build and push the image to the private registry,
and then create a Deployment using that image.

    ```bash
    $ pulumi up
    ```
   
6. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

    ```bash
    $ pulumi destroy --yes
    $ pulumi stack rm --yes
    ```
