'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OpenClawGatewayClient, getGatewayClient, resetGatewayClient } from '@/lib/openclaw-ws-client';
import type { ConnectionStatus, GatewayEventName, GatewayEventTypeMap } from '@/lib/openclaw-types';

interface UseOpenClawGatewayReturn {
    client: OpenClawGatewayClient | null;
    connected: boolean;
    connecting: boolean;
    status: ConnectionStatus;
    error: string | null;
    call: <M extends keyof import('@/lib/openclaw-types').RPCMethodMap>(
        method: M,
        params?: import('@/lib/openclaw-types').RPCMethodMap[M]['params']
    ) => Promise<import('@/lib/openclaw-types').RPCMethodMap[M]['response']>;
    reconnect: () => void;
    disconnect: () => void;
}

interface UseOpenClawGatewayOptions {
    autoConnect?: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
}

// Global state to prevent multiple connections
let globalClient: OpenClawGatewayClient | null = null;
let globalStatus: ConnectionStatus = 'disconnected';
let globalError: string | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
    listeners.forEach(listener => listener());
}

/**
 * React hook for OpenClaw Gateway WebSocket connection
 * 
 * Provides:
 * - Automatic connection on mount
 * - Connection state management
 * - Type-safe RPC calls
 * - Auto-reconnect handling
 * - Event subscription support
 */
export function useOpenClawGateway(options: UseOpenClawGatewayOptions = {}): UseOpenClawGatewayReturn {
    const { autoConnect = true, onConnect, onDisconnect, onError } = options;

    const [, forceUpdate] = useState({});
    const isMounted = useRef(true);
    const hasConnected = useRef(false);
    const isInitializing = useRef(false);

    // Subscribe to global state changes
    useEffect(() => {
        const listener = () => forceUpdate({});
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    // Get token from environment (client-side)
    const getToken = useCallback(async () => {
        try {
            const res = await fetch('/api/gateway-token');
            const data = await res.json();
            return data.token;
        } catch {
            return null;
        }
    }, []);

    // Initialize and connect
    const initAndConnect = useCallback(async () => {
        // Prevent multiple simultaneous initializations
        if (isInitializing.current) return;
        isInitializing.current = true;

        try {
            const token = await getToken();

            if (!token) {
                globalError = 'Gateway token not available';
                globalStatus = 'error';
                notifyListeners();
                return;
            }

            // Create new client if needed
            if (!globalClient) {
                globalClient = getGatewayClient(token);

                // Set up status change handler
                globalClient.onStatusChange = (newStatus) => {
                    globalStatus = newStatus;

                    if (newStatus === 'connected' && !hasConnected.current) {
                        hasConnected.current = true;
                        onConnect?.();
                    } else if (newStatus === 'disconnected' && hasConnected.current) {
                        hasConnected.current = false;
                        onDisconnect?.();
                    }

                    notifyListeners();
                };

                // Set up error handler
                globalClient.onError = (err) => {
                    globalError = err;
                    onError?.(err);
                    notifyListeners();
                };
            }

            // Connect if not already connected
            if (globalStatus === 'disconnected') {
                globalStatus = 'connecting';
                notifyListeners();

                try {
                    await globalClient.connect();
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Connection failed';
                    globalError = errorMessage;
                    globalStatus = 'error';
                    notifyListeners();
                }
            }
        } finally {
            isInitializing.current = false;
        }
    }, [getToken, onConnect, onDisconnect, onError]);

    // Reconnect
    const reconnect = useCallback(() => {
        if (globalClient) {
            globalClient.disconnect();
            resetGatewayClient();
            globalClient = null;
        }
        globalStatus = 'disconnected';
        globalError = null;
        hasConnected.current = false;
        notifyListeners();

        // Re-initialize and connect
        initAndConnect();
    }, [initAndConnect]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (globalClient) {
            globalClient.disconnect();
        }
        globalStatus = 'disconnected';
        hasConnected.current = false;
        notifyListeners();
    }, []);

    // Type-safe call wrapper
    const call = useCallback(async (method: string, params?: unknown) => {
        if (!globalClient || !globalClient.connected) {
            throw new Error('Not connected to gateway');
        }
        return globalClient.call(method as any, params as any);
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        isMounted.current = true;

        if (autoConnect && globalStatus === 'disconnected' && !isInitializing.current) {
            initAndConnect();
        }

        return () => {
            isMounted.current = false;
        };
    }, [autoConnect, initAndConnect]);

    return {
        client: globalClient,
        connected: globalStatus === 'connected',
        connecting: globalStatus === 'connecting' || globalStatus === 'reconnecting',
        status: globalStatus,
        error: globalError,
        call: call as any,
        reconnect,
        disconnect,
    };
}

/**
 * Hook for subscribing to gateway events
 */
export function useGatewayEvent<E extends GatewayEventName>(
    event: E,
    callback: (payload: GatewayEventTypeMap[E]) => void,
    deps: React.DependencyList = []
) {
    const { client } = useOpenClawGateway({ autoConnect: false });

    useEffect(() => {
        if (!client) return;

        const unsubscribe = client.on(event, callback);
        return unsubscribe;
    }, [client, event, ...deps]);
}

/**
 * Hook for fetching data from gateway with auto-refresh
 */
export function useGatewayData<T>(
    fetcher: (client: OpenClawGatewayClient) => Promise<T>,
    options: {
        refreshInterval?: number;
        enabled?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
    } = {}
) {
    const { refreshInterval = 30000, enabled = true, onSuccess, onError } = options;
    const { client, connected } = useOpenClawGateway();

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!client || !connected || !enabled) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await fetcher(client);
            setData(result);
            setError(null);
            onSuccess?.(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        } finally {
            setLoading(false);
        }
    }, [client, connected, enabled, fetcher, onSuccess, onError]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh
    useEffect(() => {
        if (!refreshInterval || !enabled) return;

        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval, enabled, fetchData]);

    return { data, loading, error, refetch: fetchData };
}