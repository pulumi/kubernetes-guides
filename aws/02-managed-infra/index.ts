import * as awsx from "@pulumi/awsx";

// Create a new VPC with custom settings.
const vpcName = "eksVpc";
const vpc = new awsx.ec2.Vpc(vpcName, {
    cidrBlock: "172.16.0.0/16",
    numberOfAvailabilityZones: "all",
    tags: { "Name": vpcName },
});

// Export the VPC resource IDs.
export const vpcId = vpc.id;
export const publicSubnetIds = vpc.publicSubnetIds;
export const privateSubnetIds = vpc.privateSubnetIds;

/*
// Use the default VPC
const defaultVpc = awsx.ec2.Vpc.getDefault();

// Export the VPC resource IDs.
export const defaultVpcId = defaultVpc.id;
export const defaultPublicSubnetIds = defaultVpc.publicSubnetIds;
export const defaultPrivateSubnetIds = defaultVpc.privateSubnetIds;
*/

/*
// Use an existing VPC, subnets, and gateways.
const existingVpc = awsx.ec2.Vpc.fromExistingIds("existingVpc", {
    vpcId: "vpc-00000000000000000",
    publicSubnetIds: ["subnet-00000000000000000", "subnet-11111111111111111"],
    privateSubnetIds: ["subnet-22222222222222222", "subnet-33333333333333333"],
    internetGatewayId: "igw-00000000000000000",
    natGatewayIds: ["nat-00000000000000000", "nat-11111111111111111"],
})

// Export the VPC resource IDs.
export const existingVpcId = existingVpc.id;
export const existingPublicSubnetIds = existingVpc.publicSubnetIds;
export const existingPrivateSubnetIds = existingVpc.privateSubnetIds;
*/
