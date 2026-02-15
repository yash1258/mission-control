// System Status Types
export interface GatewayStatus {
    status: 'online' | 'offline' | 'unknown';
    uptime: string;
    lastRestart: string;
    version?: string;
    error?: string;
}

export interface QMDStatus {
    filesIndexed: number;
    vectors: number;
    lastUpdated: string;
    stale: boolean;
    status: 'healthy' | 'stale' | 'error';
    error?: string;
}

export interface Session {
    id: string;
    label?: string;
    platform: string;
    model: string;
    status: 'active' | 'running' | 'idle' | 'error';
    task?: string;
    startedAt: string;
    isolated: boolean;
    connected: boolean;
}

export interface SystemStatus {
    gateway: GatewayStatus;
    memory: QMDStatus;
    sessions: {
        platform: string;
        model: string;
        connected: boolean;
    };
    lastUpdated: string;
}

// Cron Status Types
export interface CronJob {
    id: string;
    name: string;
    schedule: string;
    nextRun: string;
    lastRun: string;
    status: 'ok' | 'error' | 'running' | 'disabled';
    error?: string;
    enabled: boolean;
}

export interface CronRun {
    id: string;
    jobId: string;
    startedAt: string;
    completedAt?: string;
    duration?: string;
    status: 'ok' | 'error' | 'running';
    error?: string;
    itemsProcessed?: number;
}

export interface CronStatus {
    jobs: CronJob[];
    activeCount: number;
    failures24h: number;
}

// Error Types
export interface ErrorLog {
    timestamp: string;
    source: 'gateway' | 'cron' | 'qmd' | 'unknown';
    type: string;
    message: string;
}

export interface RecentErrors {
    errors: ErrorLog[];
}

// Active Agents Types
export interface ActiveAgent {
    id: string;
    label: string;
    status: 'running' | 'idle' | 'error';
    task: string;
    startedAt: string;
}

export interface ActiveAgents {
    agents: ActiveAgent[];
}

// Action Types
export type ActionType =
    | 'restart-gateway'
    | 'run-news-scout'
    | 'run-twitter-pipeline'
    | 'reindex-qmd'
    | 'check-logs';

export interface ActionRequest {
    action: ActionType;
}

export interface ActionResult {
    success: boolean;
    result?: string;
    error?: string;
}

// CLI Result Types
export interface CLIResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

// Status indicator types
export type StatusLevel = 'online' | 'warning' | 'error' | 'unknown';

export interface StatusIndicator {
    level: StatusLevel;
    color: string;
    glow: string;
}
