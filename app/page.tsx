'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import StatusCard from '@/components/StatusCard';
import RunningAgents from '@/components/RunningAgents';
import CronResults from '@/components/CronResults';
import RecentErrors from '@/components/RecentErrors';
import QuickActions from '@/components/QuickActions';
import type {
    SystemStatus,
    CronStatus,
    RecentErrors as RecentErrorsType,
    ActiveAgents,
    ActionType,
    StatusLevel
} from '@/lib/types';

export default function Dashboard() {
    // State
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
    const [recentErrors, setRecentErrors] = useState<RecentErrorsType | null>(null);
    const [activeAgents, setActiveAgents] = useState<ActiveAgents | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);

    // Fetch all data
    const fetchAllData = useCallback(async () => {
        try {
            const [systemRes, cronRes, errorsRes, agentsRes] = await Promise.all([
                fetch('/api/system-status'),
                fetch('/api/cron-status'),
                fetch('/api/recent-errors'),
                fetch('/api/active-agents'),
            ]);

            if (systemRes.ok) {
                const data = await systemRes.json();
                setSystemStatus(data);
            }

            if (cronRes.ok) {
                setCronStatus(await cronRes.json());
            }

            if (errorsRes.ok) {
                setRecentErrors(await errorsRes.json());
            }

            if (agentsRes.ok) {
                setActiveAgents(await agentsRes.json());
            }

            setLastUpdated(new Date().toISOString());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchAllData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchAllData, 30000);

        return () => clearInterval(interval);
    }, [fetchAllData]);

    // Handle quick actions
    const handleAction = async (action: ActionType) => {
        setLoadingAction(action);

        try {
            const response = await fetch('/api/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            const result = await response.json();

            if (result.success) {
                // Refresh data after successful action
                setTimeout(fetchAllData, 1000);
            } else {
                console.error('Action failed:', result.error);
            }
        } catch (error) {
            console.error('Error executing action:', error);
        } finally {
            setLoadingAction(null);
        }
    };

    // Determine status levels
    const getGatewayStatus = (): StatusLevel => {
        if (!systemStatus?.gateway) return 'unknown';
        return systemStatus.gateway.status === 'online' ? 'online' :
            systemStatus.gateway.status === 'offline' ? 'error' : 'unknown';
    };

    const getQMDStatus = (): StatusLevel => {
        if (!systemStatus?.memory) return 'unknown';
        return systemStatus.memory.status === 'healthy' ? 'online' :
            systemStatus.memory.status === 'stale' ? 'warning' : 'error';
    };

    const getCronStatus = (): StatusLevel => {
        if (!cronStatus) return 'unknown';
        return cronStatus.failures24h > 0 ? 'warning' : 'online';
    };

    const getSessionStatus = (): StatusLevel => {
        if (!systemStatus?.sessions) return 'unknown';
        return systemStatus.sessions.connected ? 'online' : 'error';
    };

    return (
        <main className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <Header
                lastUpdated={lastUpdated}
                isLoading={isLoading}
                onRefresh={fetchAllData}
            />

            {/* Status Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in-stagger">
                <StatusCard
                    title="Gateway"
                    value={systemStatus?.gateway?.status === 'online' ? 'Online' :
                        systemStatus?.gateway?.status || 'Unknown'}
                    subtitle={`Uptime: ${systemStatus?.gateway?.uptime || 'N/A'}`}
                    status={getGatewayStatus()}
                    icon="terminal"
                />

                <StatusCard
                    title="QMD Memory"
                    value={systemStatus?.memory?.filesIndexed?.toLocaleString() || 0}
                    subtitle={`${systemStatus?.memory?.vectors?.toLocaleString() || 0} vectors`}
                    status={getQMDStatus()}
                    icon="brain"
                    warning={systemStatus?.memory?.stale ? 'Index is stale' : undefined}
                />

                <StatusCard
                    title="Cron Jobs"
                    value={cronStatus?.activeCount || 0}
                    subtitle={`${cronStatus?.failures24h || 0} failures in 24h`}
                    status={getCronStatus()}
                    icon="clock"
                />

                <StatusCard
                    title="Active Session"
                    value={systemStatus?.sessions?.platform || 'None'}
                    subtitle={systemStatus?.sessions?.model || 'N/A'}
                    status={getSessionStatus()}
                    icon="activity"
                />
            </section>

            {/* Middle Row - Panels */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <RunningAgents
                    agents={activeAgents?.agents || []}
                    isLoading={isLoading}
                />

                <CronResults
                    jobs={cronStatus?.jobs || []}
                    isLoading={isLoading}
                />

                <RecentErrors
                    errors={recentErrors?.errors || []}
                    isLoading={isLoading}
                />
            </section>

            {/* Quick Actions */}
            <section className="mt-8">
                <QuickActions
                    onAction={handleAction}
                    loadingAction={loadingAction}
                />
            </section>

            {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-border-subtle">
                <div className="flex items-center justify-between text-xs text-content-muted">
                    <span className="font-mono">Mission Control v0.1.0</span>
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
                        System operational
                    </span>
                </div>
            </footer>
        </main>
    );
}
