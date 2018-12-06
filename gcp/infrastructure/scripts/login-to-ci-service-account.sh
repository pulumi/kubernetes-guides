#!/bin/bash
set -o nounset -o errexit -o pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <identity-stack-name>"
    echo "       First argument should be the name of your GCP identity stack"
    exit 1
fi

pulumi stack output infraCiClientSecret -s "$1" > infra-ci-client-secret.json
gcloud auth activate-service-account --key-file infra-ci-client-secret.json
rm infra-ci-client-secret.json
