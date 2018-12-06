import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export function bindToRole(
    name: string,
    sa: gcp.serviceAccount.Account,
    args: { project: pulumi.Input<string>; role: pulumi.Input<string> }
): gcp.projects.IAMBinding {
    return new gcp.projects.IAMBinding(name, {
        project: args.project,
        role: args.role,
        members: [sa.email.apply(email => `serviceAccount:${email}`)]
    });
}

export function createCiKey(name: string, sa: gcp.serviceAccount.Account): gcp.serviceAccount.Key {
    return new gcp.serviceAccount.Key(name, { serviceAccountId: sa.name });
}

export function clientSecret(key: gcp.serviceAccount.Key): pulumi.Output<string> {
    return key.privateKey.apply(key => JSON.parse(Buffer.from(key, "base64").toString("ascii")));
}
