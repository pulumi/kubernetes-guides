```
pulumi stack init dev
pulumi config set identityStackRef mikhailshilkov/k8s-az-identity/dev
pulumi config set infraStackRef mikhailshilkov/k8s-az-infra/dev
pulumi config set clusterStackRef mikhailshilkov/k8s-az-cluster/dev

pulumi up
```