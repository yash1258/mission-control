// OpenClaw Gateway WebSocket Message Types

// ============================================
// Base Message Types (JSON-RPC 2.0 style)
// ============================================

export interface GatewayRequest {
    type: 'req';
    id: number;
    method: string;
    params?: Record<string, unknown>;
}

export interface GatewayResponse {
    type: 'res';
    id: number;
    ok: boolean;
    payload?: unknown;
    error?: GatewayError;
}

export interface GatewayEvent {
    type: 'event';
    event: string;
    payload: unknown;
}

export interface GatewayError {
    code: string;
    message: string;
    details?: unknown;
}

export type GatewayMessage = GatewayRequest | GatewayResponse | GatewayEvent;

// ============================================
// Connection Types
// ============================================

export interface ConnectionParams {
    role: 'operator';
    scopes: ['operator.read', 'operator.write'];
    auth: { token: string };
    client: {
        id: 'mission-control';
        version: string;
        platform: 'web';
        mode: 'operator';
    };
}

export interface ConnectionResponse {
    sessionId: string;
    serverVersion: string;
    serverTime: string;
}

// ============================================
// Health Response Types
// ============================================

export interface HealthResponse {
    ok: boolean;
    runtime: {
        state: 'running' | 'stopped';
        pid: number;
        bindMode: string;
        listening: string;
    };
    channels: Record<string, ChannelStatus>;
    agents: AgentInfo[];
    heartbeatSeconds: number;
    uptime?: number;
}

export interface ChannelStatus {
    running: boolean;
    lastProbe?: string;
    error?: string;
}

export interface AgentInfo {
    id: string;
    name: string;
    model?: string;
}

// ============================================
// Session Types
// ============================================

export interface GatewaySession {
    sessionId: string;
    kind: 'direct' | 'group';
    origin: {
        channel: string;
        provider: string;
        userId?: string;
        chatId?: string;
    };
    updatedAt: string;
    createdAt?: string;
    agent?: boolean;
    agentId?: string;
    metadata?: Record<string, unknown>;
}

export interface SessionsListResponse {
    sessions: GatewaySession[];
    total: number;
}

export interface SessionsListParams {
    limit?: number;
    offset?: number;
    active?: boolean;
}

// ============================================
// Cron Types
// ============================================

export interface GatewayCronJob {
    id: string;
    name: string;
    type: 'systemEvent' | 'agentTurn';
    schedule: CronSchedule;
    enabled: boolean;
    running: boolean;
    nextRun?: string;
    lastRun?: CronRunResult;
    agent?: {
        id: string;
        name: string;
    };
    metadata?: Record<string, unknown>;
}

export interface CronSchedule {
    kind: 'cron' | 'every' | 'at';
    expr?: string;
    everyMs?: number;
    at?: string;
}

export interface CronRunResult {
    status: 'ok' | 'error';
    at: string;
    duration?: number;
    error?: string;
    itemsProcessed?: number;
}

export interface CronListResponse {
    jobs: GatewayCronJob[];
    total: number;
}

export interface CronUpdateParams {
    id: string;
    patch: {
        enabled?: boolean;
        schedule?: CronSchedule;
    };
}

export interface CronRunParams {
    id: string;
}

// ============================================
// Event Types
// ============================================

export interface GatewayEventTypeMap {
    'session.started': GatewaySession;
    'session.ended': { sessionId: string };
    'cron.started': { jobId: string };
    'cron.completed': { jobId: string; result: CronRunResult };
    'agent.started': { agentId: string; sessionId: string };
    'agent.stopped': { agentId: string; reason: string };
    'health.update': HealthResponse;
    'channel.connected': { channel: string };
    'channel.disconnected': { channel: string; reason: string };
}

export type GatewayEventName = keyof GatewayEventTypeMap;

// ============================================
// Client State Types
// ============================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface GatewayClientState {
    status: ConnectionStatus;
    sessionId?: string;
    serverVersion?: string;
    error?: string;
    reconnectAttempts: number;
    lastConnected?: Date;
}

// ============================================
// RPC Method Types (for type-safe calls)
// ============================================

export interface RPCMethodMap {
    'connect': { params: ConnectionParams; response: ConnectionResponse };
    'health': { params?: never; response: HealthResponse };
    'sessions.list': { params?: SessionsListParams; response: SessionsListResponse };
    'cron.list': { params?: never; response: CronListResponse };
    'cron.update': { params: CronUpdateParams; response: GatewayCronJob };
    'cron.run': { params: CronRunParams; response: { runId: string } };
}

export type RPCMethod = keyof RPCMethodMap;

export type RPCParams<M extends RPCMethod> = RPCMethodMap[M]['params'];
export type RPCResponse<M extends RPCMethod> = RPCMethodMap[M]['response'];
