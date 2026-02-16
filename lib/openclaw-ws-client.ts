// OpenClaw Gateway WebSocket Client

import type {
    GatewayMessage,
    GatewayRequest,
    GatewayResponse,
    GatewayEvent,
    GatewayError,
    ConnectionParams,
    ConnectionResponse,
    ConnectionStatus,
    GatewayEventName,
    GatewayEventTypeMap,
    RPCMethod,
    RPCParams,
    RPCResponse,
} from './openclaw-types';

type RequestCallback = (error: GatewayError | null, result: unknown) => void;
type EventCallback<T = unknown> = (payload: T) => void;

interface ClientConfig {
    url: string;
    token: string;
    version?: string;
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectBaseDelay?: number;
    reconnectMaxDelay?: number;
}

const DEFAULT_CONFIG = {
    version: '1.0.0',
    reconnect: true,
    maxReconnectAttempts: 10,
    reconnectBaseDelay: 1000,
    reconnectMaxDelay: 30000,
};

/**
 * OpenClaw Gateway WebSocket Client
 * 
 * Handles WebSocket connection to OpenClaw Gateway with:
 * - JSON-RPC 2.0 style request/response
 * - Auto-reconnect with exponential backoff
 * - Event subscription system
 * - Type-safe RPC calls
 */
export class OpenClawGatewayClient {
    private ws: WebSocket | null = null;
    private requestMap = new Map<number, RequestCallback>();
    private eventListeners = new Map<string, Set<EventCallback>>();
    private messageId = 0;
    private reconnectAttempts = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private pingInterval: NodeJS.Timeout | null = null;

    private config: Required<ClientConfig>;
    private _status: ConnectionStatus = 'disconnected';
    private _error: string | null = null;
    private _sessionId: string | null = null;
    private _serverVersion: string | null = null;

    public onStatusChange?: (status: ConnectionStatus) => void;
    public onError?: (error: string) => void;

    constructor(config: ClientConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config } as Required<ClientConfig>;
    }

    // ============================================
    // Public Properties
    // ============================================

    get status(): ConnectionStatus {
        return this._status;
    }

    get connected(): boolean {
        return this._status === 'connected';
    }

    get error(): string | null {
        return this._error;
    }

    get sessionId(): string | null {
        return this._sessionId;
    }

    get serverVersion(): string | null {
        return this._serverVersion;
    }

    // ============================================
    // Connection Management
    // ============================================

    /**
     * Connect to the OpenClaw Gateway WebSocket
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            this.setStatus('connecting');
            this.clearReconnectTimeout();

            try {
                this.ws = new WebSocket(this.config.url);

                this.ws.onopen = () => {
                    console.log('[OpenClaw] WebSocket connected, sending auth handshake...');
                    this.sendConnectHandshake()
                        .then(() => {
                            this.setStatus('connected');
                            this.reconnectAttempts = 0;
                            this.startPingInterval();
                            resolve();
                        })
                        .catch((err) => {
                            this.setError(err.message);
                            this.setStatus('error');
                            reject(err);
                        });
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    console.error('[OpenClaw] WebSocket error:', error);
                    this.setError('WebSocket connection error');
                };

                this.ws.onclose = (event) => {
                    console.log('[OpenClaw] WebSocket closed:', event.code, event.reason);
                    this.handleDisconnect();
                };
            } catch (err) {
                const error = err as Error;
                this.setError(error.message);
                this.setStatus('error');
                reject(error);
            }
        });
    }

    /**
     * Disconnect from the gateway
     */
    disconnect(): void {
        this.config.reconnect = false; // Prevent auto-reconnect
        this.clearPingInterval();
        this.clearReconnectTimeout();

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.setStatus('disconnected');
        this._sessionId = null;
        this._serverVersion = null;
    }

    // ============================================
    // RPC Methods
    // ============================================

    /**
     * Make a type-safe RPC call to the gateway
     */
    async call<M extends RPCMethod>(
        method: M,
        params?: RPCParams<M>
    ): Promise<RPCResponse<M>> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const id = ++this.messageId;

            const request: GatewayRequest = {
                type: 'req',
                id,
                method,
                params: params as Record<string, unknown> | undefined,
            };

            this.requestMap.set(id, (error, result) => {
                if (error) {
                    reject(new Error(error.message));
                } else {
                    resolve(result as RPCResponse<M>);
                }
            });

            console.log('[OpenClaw] Sending request:', request);
            this.ws.send(JSON.stringify(request));

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.requestMap.has(id)) {
                    this.requestMap.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    // ============================================
    // Event Handling
    // ============================================

    /**
     * Subscribe to gateway events
     */
    on<E extends GatewayEventName>(
        event: E,
        callback: EventCallback<GatewayEventTypeMap[E]>
    ): () => void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }

        this.eventListeners.get(event)!.add(callback as EventCallback);

        // Return unsubscribe function
        return () => {
            this.eventListeners.get(event)?.delete(callback as EventCallback);
        };
    }

    /**
     * Subscribe to all events
     */
    onAny(callback: EventCallback<{ event: string; payload: unknown }>): () => void {
        const handlers = new Map<string, EventCallback>();

        // Wrap callback to include event name
        const wrappedCallback = (payload: unknown) => {
            callback(payload as { event: string; payload: unknown });
        };

        // Subscribe to known events
        const knownEvents: GatewayEventName[] = [
            'session.started', 'session.ended',
            'cron.started', 'cron.completed',
            'agent.started', 'agent.stopped',
            'health.update',
            'channel.connected', 'channel.disconnected',
        ];

        for (const event of knownEvents) {
            const handler = () => wrappedCallback;
            this.on(event, handler);
            handlers.set(event, handler);
        }

        return () => {
            handlers.forEach((handler, event) => {
                this.eventListeners.get(event)?.delete(handler);
            });
        };
    }

    // ============================================
    // Private Methods
    // ============================================

    private setStatus(status: ConnectionStatus): void {
        this._status = status;
        this.onStatusChange?.(status);
    }

    private setError(error: string): void {
        this._error = error;
        this.onError?.(error);
    }

    private sendConnectHandshake(): Promise<ConnectionResponse> {
        const params: ConnectionParams = {
            role: 'operator',
            scopes: ['operator.read', 'operator.write'],
            auth: { token: this.config.token },
            client: {
                id: 'mission-control',
                version: this.config.version,
                platform: 'web',
                mode: 'operator',
            },
        };

        return new Promise((resolve, reject) => {
            const id = ++this.messageId;

            const request: GatewayRequest = {
                type: 'req',
                id,
                method: 'connect',
                params: params as unknown as Record<string, unknown>,
            };

            this.requestMap.set(id, (error, result) => {
                if (error) {
                    reject(new Error(error.message));
                } else {
                    const response = result as ConnectionResponse;
                    this._sessionId = response.sessionId;
                    this._serverVersion = response.serverVersion;
                    console.log('[OpenClaw] Connected:', response);
                    resolve(response);
                }
            });

            this.ws?.send(JSON.stringify(request));

            // Timeout after 10 seconds
            setTimeout(() => {
                if (this.requestMap.has(id)) {
                    this.requestMap.delete(id);
                    reject(new Error('Connection handshake timeout'));
                }
            }, 10000);
        });
    }

    private handleMessage(data: string): void {
        try {
            const message: GatewayMessage = JSON.parse(data);

            if (message.type === 'res') {
                this.handleResponse(message as GatewayResponse);
            } else if (message.type === 'event') {
                this.handleEvent(message as GatewayEvent);
            } else {
                console.warn('[OpenClaw] Unknown message type:', message);
            }
        } catch (err) {
            console.error('[OpenClaw] Failed to parse message:', err);
        }
    }

    private handleResponse(response: GatewayResponse): void {
        const callback = this.requestMap.get(response.id);

        if (callback) {
            if (response.ok) {
                callback(null, response.payload);
            } else if (response.error) {
                callback(response.error, null);
            }
            this.requestMap.delete(response.id);
        } else {
            console.warn('[OpenClaw] No callback for response:', response.id);
        }
    }

    private handleEvent(event: GatewayEvent): void {
        console.log('[OpenClaw] Event received:', event.event, event.payload);

        const listeners = this.eventListeners.get(event.event);
        if (listeners) {
            listeners.forEach((callback) => {
                try {
                    callback(event.payload);
                } catch (err) {
                    console.error('[OpenClaw] Event callback error:', err);
                }
            });
        }
    }

    private handleDisconnect(): void {
        this.clearPingInterval();
        this._sessionId = null;
        this._serverVersion = null;

        if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.setStatus('reconnecting');
            this.scheduleReconnect();
        } else {
            this.setStatus('disconnected');
            if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
                this.setError('Max reconnect attempts reached');
            }
        }
    }

    private scheduleReconnect(): void {
        const delay = Math.min(
            this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
            this.config.reconnectMaxDelay
        );

        console.log(`[OpenClaw] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect().catch((err) => {
                console.error('[OpenClaw] Reconnect failed:', err);
            });
        }, delay);
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    private startPingInterval(): void {
        // Send periodic pings to keep connection alive
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.call('health').catch((err) => {
                    console.warn('[OpenClaw] Ping failed:', err);
                });
            }
        }, 30000);
    }

    private clearPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}

// ============================================
// Singleton Instance Management
// ============================================

let clientInstance: OpenClawGatewayClient | null = null;

/**
 * Get or create the singleton WebSocket client
 */
export function getGatewayClient(token?: string): OpenClawGatewayClient {
    if (!clientInstance && token) {
        clientInstance = new OpenClawGatewayClient({
            url: 'ws://127.0.0.1:18789',
            token,
        });
    }

    if (!clientInstance) {
        throw new Error('Gateway client not initialized. Call getGatewayClient with token first.');
    }

    return clientInstance;
}

/**
 * Reset the singleton (for testing or reconnection)
 */
export function resetGatewayClient(): void {
    if (clientInstance) {
        clientInstance.disconnect();
        clientInstance = null;
    }
}