import * as azure from "@pulumi/azure";
import * as azuread from "@pulumi/azuread";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

const name = pulumi.getProject();

// Create the AD service principal for the K8s cluster.
const adApp = new azuread.Application(`${name}-aks`, undefined);
const adSp = new azuread.ServicePrincipal(`${name}-aksSp`, {
    applicationId: adApp.applicationId,
});

// Generate a strong password for the Service Principal.
const password = new random.RandomString(`${name}-password`, {
    length: 20,
    special: true,
}, {additionalSecretOutputs: ["result"]}).result;
const adSpPwd = new azuread.ServicePrincipalPassword(`${name}-aksSpPassword`, {
    servicePrincipalId: adSp.id,
    value: password,
    endDate: "2099-01-01T00:00:00Z",
});

// Define a resource group (shared for all stacks)
const resourceGroup = new azure.core.ResourceGroup("k8s-az");

// Grant the resource group the "Network Contributor" role so that it
// can link the static IP to a Service LoadBalancer.
const rgNetworkRole = new azure.role.Assignment(`${name}-spRole`, {
    principalId: adSp.id,
    scope: resourceGroup.id,
    roleDefinitionName: "Network Contributor",
});

// Export outputs for other stacks
export const resourceGroupName = resourceGroup.name;
export const adApplicationId = adApp.applicationId;
export const adSpId = adSp.id;
export const adSpPassword = adSpPwd.value;
