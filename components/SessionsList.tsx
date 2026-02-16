'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Loader2, RefreshCw, Inbox } from 'lucide-react';
import { useOpenClawGateway } from '@/hooks/useOpenClawGateway';
import type { GatewaySession } from '@/lib/openclaw-types';
import SessionCard from './SessionCard';

interface SessionsListProps {
    limit?: number;
    refreshInterval?: number;
    className?: string;
}

export default function SessionsList({
    limit = 20,
    refreshInterval = 30000,
    className = ''
}: SessionsListProps) {
    const { client, connected } = useOpenClawGateway();
    const [sessions, setSessions] = useState<GatewaySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSessions = useCallback(async (isRefresh = false) => {
        if (!client || !connected) {
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const result = await client.call('sessions.list', { limit });
            setSessions(result.sessions || []);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
            setError(errorMessage);
            console.error('[SessionsList] Fetch failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [client, connected, limit]);

    // Fetch on mount and when connected
    useEffect(() => {
        if (connected) {
            fetchSessions();
        }
    }, [connected, fetchSessions]);

    // Auto-refresh
    useEffect(() => {
        if (!connected) return;

        const interval = setInterval(() => fetchSessions(true), refreshInterval);
        return () => clearInterval(interval);
    }, [connected, refreshInterval, fetchSessions]);

    // Loading state
    if (loading && !refreshing) {
        return (
            <div className={`bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-content-muted" />
                    <span className="ml-2 text-content-secondary">Loading sessions...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-content-muted" />
                        <span className="text-sm font-semibold text-content-muted uppercase tracking-wider">
                            Sessions
                        </span>
                    </div>
                </div>
                <div className="text-center py-4">
                    <p className="text-status-error text-sm">{error}</p>
                    <button
                        onClick={() => fetchSessions()}
                        className="mt-2 text-xs text-content-muted hover:text-content-primary"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (sessions.length === 0) {
        return (
            <div className={`bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-content-muted" />
                        <span className="text-sm font-semibold text-content-muted uppercase tracking-wider">
                            Sessions
                        </span>
                    </div>
                    <span className="px-2 py-0.5 text-xs bg-base-surface text-content-muted rounded-full">
                        0
                    </span>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-content-muted">
                    <Inbox className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No active sessions</p>
                </div>
            </div>
        );
    }

    // Sessions list
    return (
        <div className={`bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-content-muted" />
                    <span className="text-sm font-semibold text-content-muted uppercase tracking-wider">
                        Sessions
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs bg-status-online/10 text-status-online rounded-full">
                        {sessions.length}
                    </span>
                    <button
                        onClick={() => fetchSessions(true)}
                        disabled={refreshing}
                        className="p-1.5 rounded-md hover:bg-base-surface transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-content-muted ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Sessions grid */}
            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {sessions.map((session) => (
                    <SessionCard
                        key={session.sessionId}
                        session={session}
                    />
                ))}
            </div>

            {/* Show more indicator */}
            {sessions.length >= limit && (
                <div className="mt-3 pt-3 border-t border-border-subtle text-center">
                    <span className="text-xs text-content-muted">
                        Showing {limit} of {sessions.length} sessions
                    </span>
                </div>
            )}
        </div>
    );
}