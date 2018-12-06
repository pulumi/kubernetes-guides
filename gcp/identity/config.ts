import { Config } from "@pulumi/pulumi";

//
// GCP-specific config.
//

// project is the GCP project you are going to deploy to.
export const project = new Config("gcp").require("project");
