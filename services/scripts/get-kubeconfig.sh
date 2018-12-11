#!/bin/bash
set -o nounset -o errexit -o pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <infrastructure-stack-name>"
    echo "       First argument should be the name of your GCP infrastructure stack"
    exit 1
fi

pulumi stack output kubeconfig -s "$1" > kubeconfig.yaml
