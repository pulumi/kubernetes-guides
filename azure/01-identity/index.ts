import * as azure from "@pulumi/azure";
import * as azuread from "@pulumi/azuread";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

const name = pulumi.getProject();

// Create the server application in Azure AD.
const applicationServer = new azuread.Application(`${name}-app-server`, {
    replyUrls: ["http://k8s_server"],
    type: "webapp/api",
    groupMembershipClaims: "All",
    requiredResourceAccesses: [
        // Windows Azure Active Directory API
        {
            resourceAppId: "00000002-0000-0000-c000-000000000000",
            resourceAccesses: [{
                // DELEGATED PERMISSIONS: "Sign in and read user profile"
                id: "311a71cc-e848-46a1-bdf8-97ff7156d8e6",
                type: "Scope",
            }],
        },
        // MicrosoftGraph API
        {
            resourceAppId: "00000003-0000-0000-c000-000000000000",
            resourceAccesses: [
                // APPLICATION PERMISSIONS: "Read directory data"
                {
                    id: "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
                    type: "Role",
                },
                // DELEGATED PERMISSIONS: "Sign in and read user profile"
                {
                    id: "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
                    type: "Scope",
                },
                // DELEGATED PERMISSIONS: "Read directory data"
                {
                    id: "06da0dbc-49e2-44d2-8312-53f166ab848a",
                    type: "Scope",
                },
            ],
        },
    ],
});

const principalServer = new azuread.ServicePrincipal(`${name}-sp-server`, {
    applicationId: applicationServer.applicationId,
});

// Generate a strong password for the Service Principal.
const passwordServer = new random.RandomString(`${name}-pwd-server`, {
    length: 20,
    special: true,
}, {additionalSecretOutputs: ["result"]}).result;
const spPasswordServer = new azuread.ServicePrincipalPassword(`${name}-sppwd-server`, {
    servicePrincipalId: principalServer.id,
    value: passwordServer,
    endDate: "2099-01-01T00:00:00Z",
});

const applicationClient = new azuread.Application(`${name}-app-client`, {
    replyUrls: ["http://k8s_server"],
    type: "native",
    requiredResourceAccesses: [
        // Windows Azure Active Directory API
        {
            resourceAppId: "00000002-0000-0000-c000-000000000000",
            resourceAccesses: [{
                // DELEGATED PERMISSIONS: "Sign in and read user profile"
                id: "311a71cc-e848-46a1-bdf8-97ff7156d8e6",
                type: "Scope",
            }],
        },
        // AKS ad application server
        {
            resourceAppId: applicationServer.applicationId,
            resourceAccesses: [{
                // Server app Oauth2 permissions id
                id: applicationServer.oauth2Permissions[0].id,
                type: "Scope",
            }],
        },
    ],
});

const principalClient = new azuread.ServicePrincipal(`${name}-sp-client`, {
    applicationId: applicationClient.applicationId,
});

// Generate a strong password for the Service Principal.
const passwordClient = new random.RandomString(`${name}-pwd-client`, {
    length: 20,
    special: true,
}, {additionalSecretOutputs: ["result"]}).result;
const spPasswordClient = new azuread.ServicePrincipalPassword(`${name}-sppwd-client`, {
    servicePrincipalId: principalClient.id,
    value: passwordClient,
    endDate: "2099-01-01T00:00:00Z",
});

// Define a resource group (shared for all stacks)
const resourceGroup = new azure.core.ResourceGroup("k8s-az");

// Grant the resource group the "Network Contributor" role so that it
// can link the static IP to a Service LoadBalancer.
const rgNetworkRole = new azure.role.Assignment(`${name}-spRole`, {
    principalId: principalClient.id,
    scope: resourceGroup.id,
    roleDefinitionName: "Network Contributor",
});

const clientConfig = azure.core.getClientConfig();
const currentPrincipal = clientConfig.objectId;

const admins = new azuread.Group("admins", {
    name: "pulumi:admins",
    members: [
        currentPrincipal,
    ],
});

/* Create a new user in AD.
const dev = new azuread.User("k8s-dev", {
    userPrincipalName: "k8sdev@example.com",
    displayName: "Kubernetes Dev",
    password: "Qjker21!G",
});
*/

const dev = azuread.getUser({
    userPrincipalName: "alice@example.com",
});

const devs = new azuread.Group("devs", {
    name: "pulumi:devs",
    members: [
        // Assign a new or existing user to the group.
        dev.objectId,
    ],
});

// Export outputs for other stacks
export const resourceGroupName = resourceGroup.name;
export const adServerAppId = applicationServer.applicationId;
export const adServerAppSecret = spPasswordServer.value;
export const adClientAppId = applicationClient.applicationId;
export const adClientAppSecret = spPasswordClient.value;
export const adGroupAdmins = admins.objectId;
export const adGroupDevs = devs.objectId;
