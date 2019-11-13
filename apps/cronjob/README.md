[![Deploy](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new)

# CronJob

Create a CronJob that runs a Pod on a schedule.

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

3. Update the stack.

    ```bash
    $ pulumi up
    ```
   
4. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

    ```bash
    $ pulumi destroy --yes
    $ pulumi stack rm --yes
    ```
