import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

function getList(name: string): string[] | undefined {
    const str = config.get(name);
    return str ? str.split(",") : undefined;
}

/**
 * The VPC in which to create infrastructure resources. If left unset, a VPC will be created.
 */
export const vpcId = config.get("vpcId");

/**
 * The public subnets in the VPC to attach to the EKS cluster and other resources.
 */
export const publicSubnetIds = getList("publicSubnetIds");

/**
 * The private subnets in the VPC to attach to the EKS cluster and other resources.
 */
export const privateSubnetIds = getList("privateSubnetIds");

/**
 * When creating a VPC, whether or not to create private and public subnets. Defaults to false.
 */
export const usePrivateSubnets = config.getBoolean("usePrivateSubnets");

/**
 * When creating a VPC, the number of availability zones in which to create subnets. Defaults to 2.
 */
export const numberOfAvailabilityZones = config.getNumber("numberOfAvailabilityZones");

/**
 * The instance type for the cluster's worker nodes. Defaults to "t2.medium".
 */
export const instanceType = <aws.ec2.InstanceType | undefined>config.get("instanceType");

/**
 * The public key (if any) for the cluster's worker nodes. Setting this will enable SSH access to these nodes.
 */
export const publicKey = config.get("publicKey");

/**
 * The desired capacity of the autoscaling group that manages the cluster's worker nodes. Defaults to 2.
 */
export const desiredCapacity = config.getNumber("desiredCapacity");

/**
 * The minimum capacity of the autoscaling group that manages the cluster's worker nodes. Defaults to 1.
 */
export const minSize = config.getNumber("minSize");

/**
 * The maximum capacity of the autoscaling group that manages the cluster's worker nodes. Defaults to 2.
 */
export const maxSize = config.getNumber("maxSize");

/**
 * The storage class to create. Defaults to "gp2".
 */
export const storageClass = <eks.EBSVolumeType | undefined>config.get("storageClasses");

/**
 * The name of the identity stack to use for this cluster.
 */
export const identityStack = config.require("identityStackName");
