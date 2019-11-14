import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import { config } from "./config";

const projectName = pulumi.getProject();

// const privateSubnetIds = config.privateSubnetIds;
// const securityGroupIds = config.securityGroupIds;
const clusterName = config.clusterName;

// Generate a strong password for the Postgres DB.
const postgresDbPassword = new random.RandomString(
    `${projectName}-db-password`,
    {
        length: 20,
        special: true,
    },
    { additionalSecretOutputs: ["result"] },
).result;

// Create a Postgres DB instance.
const db = new gcp.sql.DatabaseInstance("postgresdb", {
    project: config.project,
    region: "us-west1",
    databaseVersion: "POSTGRES_9_6",
    settings: { tier: "db-f1-micro" },
});

// Configure a new SQL user.
const user = new gcp.sql.User("default", {
    project: config.project,
    instance: db.name,
    password: postgresDbPassword,
});

// Create a new k8s provider.
const provider = new k8s.Provider("provider", {
    kubeconfig: config.kubeconfig,
});

// Create a Secret from the DB connection information.
const dbConn = new k8s.core.v1.Secret(
    "postgres-db-conn",
    {
        data: {
            host: db.privateIpAddress.apply(addr => Buffer.from(addr).toString("base64")),
            port: Buffer.from("5432").toString("base64"),
            username: user.name.apply(user => Buffer.from(user).toString("base64")),
            password: postgresDbPassword.apply(pass => Buffer.from(pass).toString("base64")),
        },
    },
    { provider: provider },
);

// Create a Redis instance.
const cache = new gcp.redis.Instance("redis", {
    tier: "STANDARD_HA",
    memorySizeGb: 1,
    redisVersion: "REDIS_3_2",
});

// Create a ConfigMap from the cache connection information.
const cacheConn = new k8s.core.v1.ConfigMap(
    "postgres-db-conn",
    {
        data: {
            host: cache.host.apply(addr => Buffer.from(addr).toString("base64")),
        },
    },
    { provider: provider },
);
