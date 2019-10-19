import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";
import { config } from "./config";

const name = pulumi.getProject();

// Enable the Monitoring Diagonostic control plane component logs and AllMetrics
const azMonitoringDiagnostic = new azure.monitoring.DiagnosticSetting(name, {
    logAnalyticsWorkspaceId: config.logAnalyticsWorkspaceId,
    targetResourceId: config.clusterId,
    logs: [{
            category: "kube-apiserver",
            enabled : true,
            retentionPolicy: { enabled: true },
        },
    ],
    metrics: [{
        category: "AllMetrics",
        retentionPolicy: { enabled: true },
    }],
});
