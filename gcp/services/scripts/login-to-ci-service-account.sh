#!/bin/bash
set -o nounset -o errexit -o pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <identity-stack-name>"
    echo "       First argument should be the name of your GCP identity stack"
    exit 1
fi

pulumi stack output k8sAppDevCiClientSecret -s "$1" > k8s-app-dev-ci-client-secret.json
gcloud auth activate-service-account --key-file k8s-app-dev-ci-client-secret.json
rm k8s-app-dev-ci-client-secret.json
