import * as aws from "@pulumi/aws";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import { config } from "./config";

const projectName = pulumi.getProject();

const privateSubnetIds = config.privateSubnetIds;
const securityGroupIds = config.securityGroupIds;
const clusterName = config.clusterName;

// Generate a strong password for the Postgres DB.
const postgresDbPassword = new random.RandomString(`${projectName}-db-password`, {
	length: 20,
	special: true
}, {additionalSecretOutputs: ["result"]}).result;

// Create a Postgres DB instance of RDS.
const dbSubnets = new aws.rds.SubnetGroup(`${projectName}-subnets`, {
    subnetIds: privateSubnetIds
});
const db = new aws.rds.Instance("postgresdb", {
    engine: "postgres",
    instanceClass: "db.t2.micro",
    allocatedStorage: 20,
    dbSubnetGroupName: dbSubnets.id,
    vpcSecurityGroupIds: securityGroupIds,
    name: "testdb",
    username: "alice",
    password: postgresDbPassword,
    skipFinalSnapshot: true,
});

// Create a Secret from the DB connection information.
const provider = new k8s.Provider("eks-provider", {kubeconfig: config.kubeconfig.apply(JSON.stringify)});
const dbConn = new k8s.core.v1.Secret("postgres-db-conn",
    {
        data: {
            host: db.address.apply(addr => Buffer.from(addr).toString("base64")),
            port: db.port.apply(port => Buffer.of(port).toString("base64")),
            username: db.username.apply(user => Buffer.from(user).toString("base64")),
            password: postgresDbPassword.apply(pass => Buffer.from(pass).toString("base64")),
        },
    },
    {provider: provider},
);

// Create a Redis instance.
const cacheSubnets = new aws.elasticache.SubnetGroup(`${projectName}-cache-subnets`, {
    subnetIds: privateSubnetIds,
});
const cacheCluster = new aws.elasticache.Cluster("cachecluster", {
    engine: "redis",
    nodeType: "cache.t2.micro",
    numCacheNodes: 1,
    subnetGroupName: cacheSubnets.id,
    securityGroupIds: securityGroupIds,
});

// Create a ConfigMap from the cache connection information.
const cacheConn = new k8s.core.v1.ConfigMap("postgres-db-conn",
    {
        data: {
            host: cacheCluster.cacheNodes[0].address.apply(addr => Buffer.from(addr).toString("base64")),
        },
    },
    {provider: provider},
);
