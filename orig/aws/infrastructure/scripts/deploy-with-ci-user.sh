#!/bin/bash
set -o nounset -o errexit -o pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <identity-stack-name>"
    echo "       First argument should be the name of your AWS identity stack"
    exit 1
fi

# Use EKS management user account.
export AWS_ACCESS_KEY_ID="$(pulumi stack output --stack "$1" eksCiUserAccessKeyId)"
export AWS_SECRET_ACCESS_KEY="$(pulumi stack output --stack "$1" eksCiUserAccessKeySecret)"

pulumi up --yes
