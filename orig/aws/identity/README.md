# AWS Identity Stack

AWS exposes an [Identity Access and Management (IAM)][iam] API which can be used to grant
permissions to both human and bot users. Using this API, [**IAM User**][users] accounts can be
slotted into [**IAM Groups**][groups] (_e.g._, the `networkAdmins` IAM Group), which can then be
allocated baseline permissions using [**IAM Policies**][policies]. AWS workloads (_e.g._, AWS
Lambdas) can also be granted permissions temporarily, without the need for usernames and passwords,
using [**IAM Roles**][roles]. See the [background section](#background) for more information.

This Pulumi library allows users to define a set of AWS IAM Groups, IAM Roles, and IAM Policies,
which will be useful to the vast majority of teams running in AWS. Attached to these IAM Groups and
IAM Roles are IAM Policies that define best-practices permissions.

## Usage

### Requirements

-   [Install the Pulumi toolchain][install].

### Installing and Deploying

Get started by choosing one of the examples and running `pulumi new`. For example, for `eks-admin`,
you'd run:

```sh
# Clone the project into the local directory, install dependencies, and deploy
# to active AWS context.
pulumi new https://github.com/pulumi/kubernetes-the-prod-way/tree/master/aws/identity/examples/eks-admin
```

## Resources Created

This stack optionally defines the following IAM Groups and IAM Policies. Together, these resources
provide a reasonable baseline for most engineering organizations operating in an AWS account.

### IAM Policies created

| Policy Name             | Description                                                               | Created by default? |
| ----------------------- | ------------------------------------------------------------------------- | ------------------- |
| **useExistingIamRoles** | Allows IAM Users to attach or modify existing IAM Roles to AWS resources. | `true`              |
| **eksAdmins**           | Administrative access to EKS.                                             | `false`             |

### IAM Groups created

| Group Name              | Description                                                                                             | Created by default? |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| **admins**              | Full administrative access to all resources in the AWS account.                                         | `true`              |
| **networkAdmins**       | Administrative access to AWS managed network services.                                                  | `true`              |
| **databaseAdmins**      | Administrative access to AWS data analytics services.                                                   | `true`              |
| **securityAuditors**    | Read access to security configuration metadata.                                                         | `true`              |
| **billing**             | Administrative access to billing only.                                                                  | `true`              |
| **readOnly**            | Read access to all AWS resources.                                                                       | `true`              |
| **useExistingIamRoles** | Grants the ability to attach and modify existing IAM roles to AWS resources they have access to.        | `true`              |
| **eksAdmins**           | Administrative access to EKS.                                                                           | `false`             |
| **support**             | Access to resources needed to troubleshoot AWS issues, and file support tickets.                        | `false`             |
| **dataScientists**      | Administrative access to AWS data analytics services.                                                   | `false`             |
| **sysAdmins**           | Administrative access to AWS services required for application development and,operations.              | `false`             |
| **devPowerUsers**       | Administrative access to AWS services and resources, but no permissions to manage IAM Users and Groups. | `false`             |

## API

This library provides the above resources using two classes. We will describe them at a high level,
and then provide a simple example.

-   The optional baseline IAM Groups and Policies are defined using the `BaselineIam` class. The
    arguments to this class's constructor provide fine-grained information for each of the Policies
    and Groups specified above.
-   Users can be defined using the `User` class. Convenience methods are exposed for adding the User
    to Groups, and generating AccessKeys.

### Example Input

This example (adapted from an example in the `examples/` directory) uses the `BaselineIam` and
`User` classes exposed by this library to generate a baseline set of IAM Groups, Policies, and
Users, for the purpose of setting up CI/CD for an instance of Elastic Kubernetes Service (EKS).

```typescript
// Adapted from: aws/identity/examples/eks-admin/index.ts
import * as iam from "../../";

// Create baseline IAM Groups and Policies for an org.
const baseline = new iam.BaselineIam("baselineIam", {
    groups: {
        // Create default EKS admins group.
        defineEksAdminsGroup: true,
        // Opt out of admin and database admin Groups.
        defineAdminsGroup: false,
        defineDatabaseAdminsGroup: false,
        // Create Group for support ticket resolution. Passing an object
        // instead of boolean creates a customized IAM Group instead of default.
        defineSupportGroup: { name: "support", path: "/support/" },
    },
});

// Create an EKS admin user for CI/CD.
const eksAdminCiUser = new iam.User("bot.eksAdminCiUser", {
    groupMembership: {
        groups: [
            baseline.groups.eksAdmins!.name,
            baseline.groups.networkAdmins!.name,
            baseline.groups.useExistingIamRoles!.name, // To use pass role ARNs to k8s RoleBindings.
        ],
    },
});
const eksAdminCiUserKey = eksAdminCiUser.createAccessKey("eksAdminCiUser");
```

### Example Output

Running `pulumi up` results in the following text output. You can try this on the "real" version of
the example in the `examples/` directory.

In this text output, we can see a breakdown of the resources this app creates:

-   An IAM User, AccessKey, and group membership affiliation for `bot.eksAdminCiUser` (provided by the
    call to `new iam.User`).
-   Some default IAM Groups (provided by the call to `new iam.BaselineIam`).
    -   As we note in the comments, we can see that we opt out of creating IAM Groups for
        administrators and database administrators.
    -   Still created are Groups for `eksAdmins`, `billing`, `securityAuditors`, `networkAdmins`,
        `readOnly`, and `support`; each recieves attendant default permissions.
-   IAM Policy for IAM-passing roles.

```text
     Type                                       Name                                     Plan
 +   pulumi:pulumi:Stack                        identity-aws-identity                    create
 +   ├─ awsinfra:x:iam:User                     bot.eksAdminCiUser                       create
 +   │  ├─ aws:iam:User                         bot.eksAdminCiUser                       create
 +   │  ├─ aws:iam:AccessKey                    eksAdminCiUser                           create
 +   │  └─ aws:iam:UserGroupMembership          bot.eksAdminCiUser                       create
 +   └─ awsProd:index:BaselineIam               baselineIam                              create
 +      ├─ awsProd:index:BaselineIamGroups      baselineIam                              create
 +      │  ├─ aws:iam:Group                     eksAdmins                                create
 +      │  │  └─ aws:iam:GroupPolicyAttachment  eksAdmins-administratorAccess            create
 +      │  ├─ aws:iam:Group                     billing                                  create
 +      │  │  └─ aws:iam:GroupPolicyAttachment  billing-billing                          create
 +      │  ├─ aws:iam:Group                     securityAuditors                         create
 +      │  │  └─ aws:iam:GroupPolicyAttachment  securityAuditors-securityAudit           create
 +      │  ├─ aws:iam:Group                     networkAdmins                            create
 +      │  │  └─ aws:iam:GroupPolicyAttachment  networkAdmins-networkAdministrator       create
 +      │  ├─ aws:iam:Group                     readOnly                                 create
 +      │  │  └─ aws:iam:GroupPolicyAttachment  readOnly-readOnly                        create
 +      │  ├─ aws:iam:Group                     useExistingIamRoles                      create
 +      │  │  └─ aws:iam:GroupPolicyAttachment  useExistingIamRoles-useExistingIamRoles  create
 +      │  └─ aws:iam:Group                     support                                  create
 +      │     └─ aws:iam:GroupPolicyAttachment  support-supportUser                      create
 +      └─ awsProd:index:BaselineIamPolicies    baselineIam                              create
 +         └─ aws:iam:Policy                    iamPass                                  create
```

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
