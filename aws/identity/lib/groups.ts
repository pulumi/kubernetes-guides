import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as config from "./config";
import * as policies from "./policies";
import * as util from "./util";

//
// NOTE: These groups are largely intended to closely mirror the official AWS guidance[1] on how to
// create policies for organizations.
//
// [1]: https://aws.amazon.com/blogs/security/how-to-assign-permissions-using-new-aws-managed-policies-for-job-functions/
//

//
// Administrators.
//

export const admins =
    config.defineAdminsGroup == "true"
        ? util.newUserGroupWithPolicies("admins", {
              administratorAccess: aws.iam.AdministratorAccess
          })
        : null;

export const networkAdmins =
    config.defineNetworkAdminsGroup == "true"
        ? util.newUserGroupWithPolicies("networkAdmins", {
              networkAdministrator: aws.iam.NetworkAdministrator
          })
        : null;

export const eksAdmins =
    config.defineEksAdminsGroup == "true"
        ? util.newUserGroupWithPolicies("eksAdmins", {
              administratorAccess: aws.iam.AdministratorAccess
          })
        : null;

//
// Billing and auditing.
//

export const billing = config.defineBillingGroup
    ? util.newUserGroupWithPolicies("billing", { billing: aws.iam.Billing })
    : null;

export const securityAuditors = config.defineSecurityAuditorsGroup
    ? util.newUserGroupWithPolicies("securityAuditors", {
          securityAudit: aws.iam.SecurityAudit
      })
    : null;

//
// Support, read-only, IAM-passing, and non-administrator roles.
//

export const readOnly = config.defineReadOnlyGroup
    ? util.newUserGroupWithPolicies("readOnly", {
          readOnly: aws.iam.ViewOnlyAccess
      })
    : null;

export const useExistingIamRoles = config.defineUseExistingIamRolesGroup
    ? util.newUserGroupWithPolicies("useExistingIamRoles", {
          useExistingIamRoles: policies.useExistingIamRoles.arn
      })
    : null;

export const support = config.defineSupportGroup
    ? util.newUserGroupWithPolicies("support", {
          supportUser: aws.iam.SupportUser
      })
    : null;

//
// Engineering departments.
//

// export const engineering = util.newGroupWithPolicies("engineering", { path: "/users/" }, {});

export const dataScientists =
    config.defineDataScientistsGroup == "true"
        ? util.newUserGroupWithPolicies("dataScientists", {
              dataScientist: aws.iam.DataScientist
          })
        : null;

export const devPowerUsers =
    config.defineDevPowerUsersGroup == "true"
        ? util.newUserGroupWithPolicies("developerPowerUsers", {
              powerUserAccess: aws.iam.PowerUserAccess
          })
        : null;

export const databaseAdmins =
    config.defineDatabaseAdminsGroup == "true"
        ? util.newUserGroupWithPolicies("databaseAdmins", {
              databaseAdministrator: aws.iam.DatabaseAdministrator
          })
        : null;

export const sysAdmins =
    config.defineSysAdminsGroup == "true"
        ? util.newUserGroupWithPolicies("systemAdmins", {
              systemAdministrator: aws.iam.SystemAdministrator
          })
        : null;
