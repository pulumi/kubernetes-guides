import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

//
// Define groups.
//

export const defineAdminsGroup = config.get("admins") || "true";
export const defineNetworkAdminsGroup = config.get("networkAdmins") || "true";
export const defineBillingGroup = config.get("billing") || "true";
export const defineSecurityAuditorsGroup = config.get("securityAuditors") || "true";
export const defineReadOnlyGroup = config.get("readOnly") || "true";
export const defineUseExistingIamRolesGroup = config.get("useExistingIamRoles") || "true";
export const defineEksAdminsGroup = config.get("defineEksAdminGroup") || "true";

export const defineSupportGroup = config.get("support") || "false";
export const defineDataScientistsGroup = config.get("defineDataScientistsGroup") || "false";
export const defineDevPowerUsersGroup = config.get("defineDevPowerUsersGroup") || "false";
export const defineDatabaseAdminsGroup = config.get("defineDatabaseAdminsGroup") || "false";
export const defineSysAdminsGroup = config.get("defineSysAdminsGroup") || "false";

//
// Define policies.
//

export const defineUseExistingIamRolesPolicy =
    config.get("defineIamPassRolePolicy") || defineUseExistingIamRolesGroup || "true";
export const defineEksAdminsPolicy =
    config.get("defineEksAdminsPolicy") || defineEksAdminsGroup || "true";
