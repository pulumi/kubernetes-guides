```
pulumi stack init dev
pulumi config set identityStackRef mikhailshilkov/k8s-az-identity/dev
pulumi config set infraStackRef mikhailshilkov/k8s-az-infra/dev

# See https://github.com/Azure/AKS/blob/master/previews.md
az extension add --name aks-preview
az feature register -n APIServerSecurityPreview --namespace Microsoft.ContainerService
az provider register -n Microsoft.ContainerService

pulumi up
```