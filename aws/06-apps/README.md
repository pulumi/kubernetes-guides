```
pulumi stack init dev
pulumi config set aws:region us-west-2
pulumi config set identityStackRef myorg/k8s-az-identity/dev
pulumi config set infraStackRef myorg/k8s-az-infra/dev
pulumi config set clusterStackRef myorg/k8s-az-cluster/dev

pulumi up
```
