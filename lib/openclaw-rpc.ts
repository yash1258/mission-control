// OpenClaw Gateway RPC Convenience Functions

import type { OpenClawGatewayClient } from './openclaw-ws-client';
import type {
    HealthResponse,
    SessionsListParams,
    SessionsListResponse,
    CronListResponse,
    CronUpdateParams,
    GatewayCronJob,
} from './openclaw-types';

// ============================================
// Health RPC Methods
// ============================================

/**
 * Get gateway health status
 */
export async function getHealth(client: OpenClawGatewayClient): Promise<HealthResponse> {
    return client.call('health');
}

// ============================================
// Sessions RPC Methods
// ============================================

/**
 * List active sessions
 */
export async function listSessions(
    client: OpenClawGatewayClient,
    params?: SessionsListParams
): Promise<SessionsListResponse> {
    return client.call('sessions.list', params);
}

// ============================================
// Cron RPC Methods
// ============================================

/**
 * List all cron jobs
 */
export async function listCronJobs(client: OpenClawGatewayClient): Promise<CronListResponse> {
    return client.call('cron.list');
}

/**
 * Update a cron job (enable/disable, change schedule)
 */
export async function updateCronJob(
    client: OpenClawGatewayClient,
    params: CronUpdateParams
): Promise<GatewayCronJob> {
    return client.call('cron.update', params);
}

/**
 * Run a cron job immediately
 */
export async function runCronJob(
    client: OpenClawGatewayClient,
    jobId: string
): Promise<{ runId: string }> {
    return client.call('cron.run', { id: jobId });
}

/**
 * Enable a cron job
 */
export async function enableCronJob(
    client: OpenClawGatewayClient,
    jobId: string
): Promise<GatewayCronJob> {
    return updateCronJob(client, { id: jobId, patch: { enabled: true } });
}

/**
 * Disable a cron job
 */
export async function disableCronJob(
    client: OpenClawGatewayClient,
    jobId: string
): Promise<GatewayCronJob> {
    return updateCronJob(client, { id: jobId, patch: { enabled: false } });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format a cron schedule for display
 */
export function formatSchedule(schedule: { kind: string; expr?: string; everyMs?: number; at?: string }): string {
    switch (schedule.kind) {
        case 'cron':
            return `Cron: ${schedule.expr}`;
        case 'every':
            if (schedule.everyMs) {
                const minutes = schedule.everyMs / 60000;
                if (minutes >= 60) {
                    const hours = minutes / 60;
                    return `Every ${hours}h`;
                }
                return `Every ${minutes}min`;
            }
            return 'Every (unknown)';
        case 'at':
            if (schedule.at) {
                const date = new Date(schedule.at);
                return `At: ${date.toLocaleString()}`;
            }
            return 'At (unknown)';
        default:
            return 'Unknown schedule';
    }
}

/**
 * Get status badge color for cron job
 */
export function getCronJobStatus(job: GatewayCronJob): {
    status: 'running' | 'enabled' | 'disabled' | 'error';
    color: string;
    icon: string;
} {
    if (job.running) {
        return { status: 'running', color: 'green', icon: 'loader' };
    }
    if (!job.enabled) {
        return { status: 'disabled', color: 'gray', icon: 'pause' };
    }
    if (job.lastRun?.status === 'error') {
        return { status: 'error', color: 'red', icon: 'alert-circle' };
    }
    return { status: 'enabled', color: 'blue', icon: 'check' };
}

/**
 * Get provider icon name from provider string
 */
export function getProviderIcon(provider: string): string {
    const providerMap: Record<string, string> = {
        telegram: 'MessageCircle',
        discord: 'Hash',
        slack: 'Slack',
        whatsapp: 'MessageSquare',
        web: 'Globe',
        api: 'Code',
    };

    return providerMap[provider.toLowerCase()] || 'MessageSquare';
}

/**
 * Get provider color from provider string
 */
export function getProviderColor(provider: string): string {
    const colorMap: Record<string, string> = {
        telegram: '#0088cc',
        discord: '#5865F2',
        slack: '#4A154B',
        whatsapp: '#25D366',
        web: '#6366F1',
        api: '#8B5CF6',
    };

    return colorMap[provider.toLowerCase()] || '#6B7280';
}