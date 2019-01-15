# AWS Identity Stack

AWS exposes an an [Identity Access and Management (IAM)][iam] API which can be used to grant
permissions to both human and bot users. Using this API, [**IAM User**][users] accounts can be
slotted into [**IAM Groups**][groups] (_e.g._, the `engineering` IAM Group), which can then be
allocated baseline permissions using [**IAM Policies**][policies]. AWS workloads (_e.g._, AWS
Lambdas) can also be granted permissions temporarily, without the need for usernames and passwords,
using [**IAM Roles**][roles]. See the [background section](#background) for more information.

This Pulumi application defines a set of AWS IAM Groups, IAM Roles, and IAM Policies, which will be
useful to the vast majority of teams running in AWS. Attached to these IAM Groups and IAM Roles are
IAM Policies that define best-practices permissions.

## Usage

### Requirements

* [Install the Pulumi toolchain][install].

### Installing and Deploying

```sh
# Clone the project into the local directory, install dependencies, and deploy
# to active AWS context.
pulumi new https://github.com/pulumi/kubernetes-the-prod-way/tree/master/aws/identity
```

## Resources Created

### IAM Groups created

This stack optionally defines the following IAM Groups. Each IAM Group is generated (or not) based
on a Pulumi config variable listed in the table below. For example, to opt out of the `admins`
IAM Group, run: `pulumi config set defineAdminsGroup false`.

| Group Name              | Description                                                                                             | Input Variable                   | Default |
|-------------------------|---------------------------------------------------------------------------------------------------------|----------------------------------|---------|
| **admins**              | Full administrative access to all resources in the AWS account.                                         | `defineAdminsGroup`              | `true`  |
| **networkAdmins**       | Administrative access to AWS managed network services.                                                  | `defineNetworkAdminsGroup`       | `true`  |
| **securityAuditors**    | Read access to security configuration metadata.                                                         | `defineSecurityAuditorsGroup`    | `true`  |
| **billing**             | Administrative access to billing only.                                                                  | `defineBillingGroup`             | `true`  |
| **readOnly**            | Read access to all AWS resources.                                                                       | `defineReadOnlyGroup`            | `true`  |
| **useExistingIamRoles** | Grants the ability to attach and modify existing IAM roles to AWS resources they have access to.        | `defineUseExistingIamRolesGroup` | `true`  |
| **eksAdmins**           | Administrative access to EKS.                                                                           | `defineEksAdminGroup`            | `true`  |
| **support**             | Access to resources needed to troubleshoot AWS issues, and file support tickets.                        | `defineSupportGroup`             | `false` |
| **dataScientists**      | Administrative access to AWS data analytics services.                                                   | `defineDataScientistsGroup`      | `false` |
| **databaseAdmins**      | Administrative access to AWS data analytics services.                                                   |                                  | `false` |
| **sysAdmins**           | Administrative access to AWS services required for application development and,operations.              | `defineSysAdminsGroup`           | `false` |
| **devPowerUsers**       | Administrative access to AWS services and resources, but no permissions to manage IAM Users and Groups. | `defineDevPowerUsersGroup`       | `false` |

### IAM Policies created

| Policy Name                         | Description                                                               | Input Variable                    | Default |
|-------------------------------------|---------------------------------------------------------------------------|-----------------------------------|---------|
| `useExistingIamRolesPolicyDocument` | Allows IAM Users to attach or modify existing IAM Roles to AWS resources. | `defineUseExistingIamRolesPolicy` | `true`  |
| `eksAdmins`                         | Administrative access to EKS.                                             | `defineEksAdminsPolicy`           | `true`  |

## Stack Outputs

Pulumi allows you to export the computed values of resources once they're finished initializing.
For example, this is useful for exporting IAM User credentials so that CI/CD systems can log in as
that user.

| Variable Name                  | Description                                                                                                                   |
|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `networkCiUserAccessKeyId`     | The CI key ID for the infrastructure CI account. This can be used with the `aws` CLI tool to log in as this user account.     |
| `networkCiUserAccessKeySecret` | The CI key secret for the infrastructure CI account. This can be used with the `aws` CLI tool to log in as this user account. |
| `eksCiUserAccessKeyId`         | The CI key ID for the EKS CI account. This can be used with the `aws` CLI tool to log in as this user account.                |
| `eksCiUserAccessKeySecret`     | The CI key secret for the EKS CI account. This can be used with the `aws` CLI tool to log in as this user account.            |
| `kubeAppRoleArn`               | ARN of the Kubernetes App Role. This will be used by the CI system to deploy Kubernetes apps.                                 |

## Background

The AWS [Identity Access and Management (IAM)][iam] API allows AWS account administrators to manage
permissions of user accounts and AWS workloads. In this section, we will discuss the basic set of
nouns in the AWS IAM API which we use in this project.

### Users

Every human and machine must be assigned an [**IAM User**][users] account. IAM Users are the atoms of
identity on AWS: a user account is associated with permissions that allow them to perform actions on
AWS resoruces.

A very commmon practice is to have a conventional naming scheme for user types. For example:
`employee.barbara.liskov`,`contractor.grace.hopper`, and `bot.travisci`, and so on. This application
provides base classes `EmployeeUser`, `ContractorUser`, and `BotUser` to help enforce these naming
practices.

### Groups

An [**IAM Group**][groups] is a collection of users and a set of policies that apply to those users.

IAM Groups are useful primarily because they allow us to manage the permissions of collections of
IAM Users _en masse_. This is **almost always** preferable to managing permissions at the level of
individual IAM Users.

### Roles

Rather than hard-coding policy, usernames, and passwords into AWS workloads (_e.g._, AWS Lambda
Functions, EC2 instances, _etc_.) AWS allows users to define [**IAM Roles**][roles]. IAM Roles allow us to
grant workloads permissions to perform operations on other AWS resources, but instead of providing a
password, AWS handles authentication transparently. For example, we can use an IAM Role to grant an
AWS Lambda Function permissions to access to a file in an S3 Bucket.

### Policies

Each resource type is supports a set of operations that can be performed on it, which are governed
using a set of IAM permissions. For example, the IAM API exposes permissions such as
`iam:ChangePassword` and `iam:GetUser`.

Permissions are defined and managed using [**IAM Policy**][policies]. IAM Policies can be used to
attach permissions to IAM Users, IAM Groups, and IAM Roles. By default each of these things has no
permissions; attaching an IAM Policy to one grants it permissions.

Permissions are defined in an IAM Policy using a JSON API. In the following example, we define a
policy document that allows users to change their own passwords.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
        "Effect": "Allow",
        "Action": [
            "iam:*AccessKey*",
            "iam:ChangePassword",
            "iam:GetUser",
            "iam:*ServiceSpecificCredential*",
            "iam:*SigningCertificate*"
        ],
        "Resource": ["arn:aws:iam::*:user/${aws:username}"]
    }
  ]
}
```


[install]: https://pulumi.io/quickstart/install.html
[iam]: https://aws.amazon.com/iam/
[users]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html
[groups]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups.html
[roles]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html
[policies]: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html
