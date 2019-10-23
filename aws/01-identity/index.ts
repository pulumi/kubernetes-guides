import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// The managed policies EKS requires of nodegroups join a cluster.
const nodegroupManagedPolicyArns: string[] = [
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
];

// Create the EKS cluster admins role.
const adminsName = "admins";
const adminsIamRole = new aws.iam.Role(`${adminsName}-eksClusterAdmin`, {
    assumeRolePolicy: aws.getCallerIdentity().then(id => 
        aws.iam.assumeRolePolicyForPrincipal({"AWS": `arn:aws:iam::${id.accountId}:root`}))
})
export const adminsIamRoleArn = adminsIamRole.arn;
const adminsIamRolePolicy = new aws.iam.RolePolicy(`${adminsName}-eksClusterAdminPolicy`, {
    role: adminsIamRole,
    policy: {
        Version: "2012-10-17",
        Statement: [
            { Effect: "Allow", Action: ["eks:*", "ec2:DescribeImages"], Resource: "*", },
            { Effect: "Allow", Action: "iam:PassRole", Resource: "*"},
        ],
    },
},
    { parent: adminsIamRole },
);

// Create the EKS cluster developers role.
const devName = "devs";
const devsIamRole = new aws.iam.Role(`${devName}-eksClusterDeveloper`, {
    assumeRolePolicy: aws.getCallerIdentity().then(id => 
        aws.iam.assumeRolePolicyForPrincipal({"AWS": `arn:aws:iam::${id.accountId}:root`}))
})
export const devsIamRoleArn = devsIamRole.arn;

// Create the standard node group worker role and attach the required policies.
const stdName = "standardNodeGroup";
const stdNodegroupIamRole = new aws.iam.Role(`${stdName}-eksClusterWorkerNode`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({"Service": "ec2.amazonaws.com"})
})
attachPoliciesToRole(stdName, stdNodegroupIamRole, nodegroupManagedPolicyArns);
export const stdNodegroupIamRoleArn = stdNodegroupIamRole.arn;

// Create the performant node group worker role and attach the required policies.
const perfName = "performanceNodeGroup";
const perfNodegroupIamRole = new aws.iam.Role(`${perfName}-eksClusterWorkerNode`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({"Service": "ec2.amazonaws.com"})
})
attachPoliciesToRole(perfName, perfNodegroupIamRole, nodegroupManagedPolicyArns);
export const perfNodegroupIamRoleArn = perfNodegroupIamRole.arn;

// Attach policies to a role.
function attachPoliciesToRole(name: string, role: aws.iam.Role, policyArns: string[]) {
    for (const policyArn of policyArns) {
        new aws.iam.RolePolicyAttachment(`${name}-${policyArn.split('/')[1]}`,
            { policyArn: policyArn, role: role },
        );
    }
}
