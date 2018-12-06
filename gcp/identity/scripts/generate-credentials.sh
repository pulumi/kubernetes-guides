#!/bin/bash
set -o nounset -o errexit -o pipefail

pulumi stack output infraCiClientSecret > infra-ci-client-secret.json
pulumi stack output k8sAppDevCiClientSecret > k8s-app-dev-ci-client-secret.json
