'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { useOpenClawGateway } from '@/hooks/useOpenClawGateway';
import type { GatewayCronJob } from '@/lib/openclaw-types';
import CronJobCard from './CronJobCard';

interface CronJobsListProps {
    refreshInterval?: number;
    className?: string;
}

export default function CronJobsList({
    refreshInterval = 30000,
    className = ''
}: CronJobsListProps) {
    const { client, connected } = useOpenClawGateway();
    const [jobs, setJobs] = useState<GatewayCronJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

    const fetchJobs = useCallback(async (isRefresh = false) => {
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

            const result = await client.call('cron.list');
            setJobs(result.jobs || []);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cron jobs';
            setError(errorMessage);
            console.error('[CronJobsList] Fetch failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [client, connected]);

    // Fetch on mount and when connected
    useEffect(() => {
        if (connected) {
            fetchJobs();
        }
    }, [connected, fetchJobs]);

    // Auto-refresh
    useEffect(() => {
        if (!connected) return;

        const interval = setInterval(() => fetchJobs(true), refreshInterval);
        return () => clearInterval(interval);
    }, [connected, refreshInterval, fetchJobs]);

    // Toggle job enabled/disabled
    const handleToggle = async (jobId: string, enabled: boolean) => {
        if (!client || !connected) return;

        try {
            setUpdatingJobId(jobId);

            await client.call('cron.update', {
                id: jobId,
                patch: { enabled }
            });

            // Update local state optimistically
            setJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, enabled } : job
            ));
        } catch (err) {
            console.error('[CronJobsList] Toggle failed:', err);
            // Revert on error by refetching
            fetchJobs(true);
        } finally {
            setUpdatingJobId(null);
        }
    };

    // Run job immediately
    const handleRun = async (jobId: string) => {
        if (!client || !connected) return;

        try {
            setUpdatingJobId(jobId);

            await client.call('cron.run', { id: jobId });

            // Mark as running in local state
            setJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, running: true } : job
            ));
        } catch (err) {
            console.error('[CronJobsList] Run failed:', err);
        } finally {
            setUpdatingJobId(null);
        }
    };

    // Calculate stats
    const enabledCount = jobs.filter(j => j.enabled).length;
    const runningCount = jobs.filter(j => j.running).length;
    const errorCount = jobs.filter(j => j.lastRun?.status === 'error').length;

    // Loading state
    if (loading && !refreshing) {
        return (
            <div className={`bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-content-muted" />
                    <span className="ml-2 text-content-secondary">Loading cron jobs...</span>
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
                        <Clock className="w-4 h-4 text-content-muted" />
                        <span className="text-sm font-semibold text-content-muted uppercase tracking-wider">
                            Cron Jobs
                        </span>
                    </div>
                </div>
                <div className="text-center py-4">
                    <p className="text-status-error text-sm">{error}</p>
                    <button
                        onClick={() => fetchJobs()}
                        className="mt-2 text-xs text-content-muted hover:text-content-primary"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (jobs.length === 0) {
        return (
            <div className={`bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-content-muted" />
                        <span className="text-sm font-semibold text-content-muted uppercase tracking-wider">
                            Cron Jobs
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-content-muted">
                    <Calendar className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No scheduled jobs</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-base-elevated border border-border-subtle rounded-xl p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-content-muted" />
                    <span className="text-sm font-semibold text-content-muted uppercase tracking-wider">
                        Cron Jobs
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Stats badges */}
                    <div className="flex items-center gap-1.5">
                        {runningCount > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-status-online/10 text-status-online rounded-full flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {runningCount}
                            </span>
                        )}
                        {errorCount > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-status-error/10 text-status-error rounded-full">
                                {errorCount} errors
                            </span>
                        )}
                        <span className="px-2 py-0.5 text-xs bg-base-surface text-content-muted rounded-full">
                            {enabledCount}/{jobs.length}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchJobs(true)}
                        disabled={refreshing}
                        className="p-1.5 rounded-md hover:bg-base-surface transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-content-muted ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Jobs grid */}
            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {jobs.map((job) => (
                    <CronJobCard
                        key={job.id}
                        job={job}
                        onToggle={(enabled) => handleToggle(job.id, enabled)}
                        onRun={() => handleRun(job.id)}
                        isUpdating={updatingJobId === job.id}
                    />
                ))}
            </div>
        </div>
    );
}