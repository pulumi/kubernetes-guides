import * as aws from "@pulumi/aws";

import * as config from "./config";

const useExistingIamRolesPolicyDocument: aws.iam.PolicyDocument = {
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Action: "iam:PassRole", Resource: "*" }]
};
export const useExistingIamRoles =
    config.defineUseExistingIamRolesPolicy == "true"
        ? new aws.iam.Policy("iamPass", {
              description:
                  "Allows IAM Users to attach or modify existing IAM Roles to AWS resources",
              policy: JSON.stringify(useExistingIamRolesPolicyDocument)
          })
        : null;

const eksAdminPolicyDoc: aws.iam.PolicyDocument = {
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Action: ["eks:*", "ec2:DescribeImages"], Resource: "*" }]
};
export const eksAdmins =
    config.defineEksAdminsPolicy == "true"
        ? new aws.iam.Policy("eksAdmins", {
              description: "Administrative access for EKS clusters",
              policy: JSON.stringify(eksAdminPolicyDoc)
          })
        : null;
