```
pulumi stack init dev
pulumi config set gcp:project [your-gcp-project-here]
pulumi config set gcp:zone [your-gcp-zone-here]
pulumi config set identityStackRef myorg/k8s-az-identity/dev
pulumi config set infraStackRef myorg/k8s-az-infra/dev
pulumi config set clusterStackRef myorg/k8s-az-cluster/dev

pulumi up
```
