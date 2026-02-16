'use client';

import { useState, useEffect, useCallback } from 'react';
import { Server, CheckCircle, XCircle, Loader2, RefreshCw, Radio } from 'lucide-react';
import { useOpenClawGateway } from '@/hooks/useOpenClawGateway';
import type { HealthResponse } from '@/lib/openclaw-types';
import type { StatusLevel } from '@/lib/types';

interface ChannelIndicatorProps {
    name: string;
    running: boolean;
    lastProbe?: string;
    error?: string;
}

function ChannelIndicator({ name, running, lastProbe, error }: ChannelIndicatorProps) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${running ? 'bg-status-online status-pulse' : 'bg-status-error'}`} />
            <span className="text-content-secondary capitalize">{name}</span>
            {error && (
                <span className="text-status-error text-xs truncate max-w-[100px]" title={error}>
                    ⚠
                </span>
            )}
        </div>
    );
}

interface GatewayStatusProps {
    className?: string;
}

export default function GatewayStatus({ className = '' }: GatewayStatusProps) {
    const { client, connected, connecting, status, error: connectionError, reconnect } = useOpenClawGateway();
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = useCallback(async () => {
        if (!client || !connected) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await client.call('health');
            setHealth(result);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Health check failed';
            setError(errorMessage);
            console.error('[GatewayStatus] Health check failed:', err);
        } finally {
            setLoading(false);
        }
    }, [client, connected]);

    // Fetch health on mount and when connected
    useEffect(() => {
        if (connected) {
            fetchHealth();
        }
    }, [connected, fetchHealth]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!connected) return;

        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [connected, fetchHealth]);

    // Determine status level
    const getStatusLevel = (): StatusLevel => {
        if (connectionError || error) return 'error';
        if (connecting) return 'unknown';
        if (!connected) return 'error';
        if (!health) return 'unknown';
        if (health.ok && health.runtime?.state === 'running') return 'online';
        return 'error';
    };

    const statusLevel = getStatusLevel();

    // Format uptime
    const formatUptime = (seconds?: number): string => {
        if (!seconds) return 'N/A';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    // Loading state
    if (connecting || (loading && !health)) {
        return (
            <div className={`relative bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-content-muted" />
                    <span className="ml-2 text-content-secondary">Connecting...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (connectionError || error || !connected) {
        return (
            <div className={`relative bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-status-error/10">
                        <Server className="w-4 h-4 text-status-error" />
                    </div>
                    <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                        Gateway Status
                    </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-status-error" />
                    <span className="text-xl font-bold text-status-error">Disconnected</span>
                </div>

                <p className="text-sm text-content-secondary mb-4">
                    {connectionError || error || 'Not connected to gateway'}
                </p>

                <button
                    onClick={reconnect}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-status-error/10 
                             text-status-error rounded-lg hover:bg-status-error/20 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reconnect
                </button>
            </div>
        );
    }

    // Connected state with health data
    return (
        <div className={`relative bg-base-elevated border border-border-subtle rounded-xl p-5 
                        card-hover overflow-hidden shimmer-border
                        status-accent-line ${statusLevel} ${className}`}>
            {/* Background gradient accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${statusLevel === 'online' ? 'from-status-online/20 to-transparent' : 'from-status-error/20 to-transparent'
                } opacity-50`} />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${statusLevel === 'online' ? 'bg-status-online/10' : 'bg-status-error/10'}`}>
                            <Server className={`w-4 h-4 ${statusLevel === 'online' ? 'text-status-online' : 'text-status-error'}`} />
                        </div>
                        <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                            Gateway Status
                        </span>
                    </div>

                    {/* Connection indicator */}
                    <div className="flex items-center gap-1.5">
                        <Radio className={`w-3 h-3 ${connected ? 'text-status-online' : 'text-status-error'}`} />
                        <span className="text-xs text-content-muted">
                            {connected ? 'WebSocket' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Main Status */}
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        {health?.ok ? (
                            <CheckCircle className="w-6 h-6 text-status-online" />
                        ) : (
                            <XCircle className="w-6 h-6 text-status-error" />
                        )}
                        <span className={`text-2xl font-bold ${health?.ok ? 'text-status-online' : 'text-status-error'}`}>
                            {health?.runtime?.state === 'running' ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                </div>

                {/* Runtime Details */}
                {health?.runtime && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <span className="text-xs text-content-muted block">PID</span>
                            <span className="text-sm font-mono text-content-primary">{health.runtime.pid}</span>
                        </div>
                        <div>
                            <span className="text-xs text-content-muted block">Port</span>
                            <span className="text-sm font-mono text-content-primary">{health.runtime.listening}</span>
                        </div>
                        <div>
                            <span className="text-xs text-content-muted block">Bind Mode</span>
                            <span className="text-sm text-content-primary capitalize">{health.runtime.bindMode}</span>
                        </div>
                        <div>
                            <span className="text-xs text-content-muted block">Heartbeat</span>
                            <span className="text-sm text-content-primary">{health.heartbeatSeconds}s</span>
                        </div>
                    </div>
                )}

                {/* Channels */}
                {health?.channels && Object.keys(health.channels).length > 0 && (
                    <div className="border-t border-border-subtle pt-3">
                        <span className="text-xs text-content-muted block mb-2">Channels</span>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(health.channels).map(([name, ch]) => (
                                <ChannelIndicator
                                    key={name}
                                    name={name}
                                    running={ch.running}
                                    lastProbe={ch.lastProbe}
                                    error={ch.error}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Agents */}
                {health?.agents && health.agents.length > 0 && (
                    <div className="border-t border-border-subtle pt-3 mt-3">
                        <span className="text-xs text-content-muted block mb-2">
                            Agents ({health.agents.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {health.agents.slice(0, 3).map((agent) => (
                                <span
                                    key={agent.id}
                                    className="px-2 py-0.5 text-xs bg-status-online/10 text-status-online rounded"
                                >
                                    {agent.name}
                                </span>
                            ))}
                            {health.agents.length > 3 && (
                                <span className="px-2 py-0.5 text-xs bg-base-surface text-content-muted rounded">
                                    +{health.agents.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Status Indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span
                    className={`w-2 h-2 rounded-full ${statusLevel === 'online' ? 'bg-status-online status-glow-green status-pulse' : 'bg-status-error'
                        }`}
                    title={statusLevel}
                />
            </div>
        </div>
    );
}