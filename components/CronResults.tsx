'use client';

import { Clock } from 'lucide-react';
import type { CronJob } from '@/lib/types';

interface CronResultsProps {
    jobs: CronJob[];
    isLoading?: boolean;
}

const statusStyles = {
    ok: { dot: 'bg-status-online', text: 'text-status-online', bg: 'bg-status-online/10' },
    error: { dot: 'bg-status-error', text: 'text-status-error', bg: 'bg-status-error/10' },
    running: { dot: 'bg-status-info', text: 'text-status-info', bg: 'bg-status-info/10' },
    disabled: { dot: 'bg-content-muted', text: 'text-content-muted', bg: 'bg-base-surface' },
};

function formatTime(timestamp: string): string {
    if (!timestamp || timestamp === 'N/A' || timestamp === 'Never') return 'Never';

    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return timestamp;
    }
}

export default function CronResults({ jobs, isLoading }: CronResultsProps) {
    // Get last 4 runs from all jobs
    const recentRuns = jobs
        .filter(j => j.enabled && j.lastRun && j.lastRun !== 'Never')
        .slice(0, 4);

    return (
        <div className="bg-base-elevated border border-border-subtle rounded-xl overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 
                      border-b border-border-subtle
                      bg-gradient-to-b from-base-surface to-transparent">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-content-muted" />
                    <span className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
                        Recent Cron Results
                    </span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full 
                         bg-base-surface text-content-muted">
                    {jobs.filter(j => j.enabled).length} jobs
                </span>
            </div>

            {/* Content */}
            <div className="p-4 max-h-64 overflow-y-auto">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton h-14 w-full" />
                        ))}
                    </div>
                ) : recentRuns.length === 0 ? (
                    <div className="text-center py-8 text-content-muted text-sm">
                        No recent cron runs
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentRuns.map((job, index) => {
                            const styles = statusStyles[job.status];
                            return (
                                <div
                                    key={job.id}
                                    className="p-3 rounded-lg hover:bg-base-surface 
                             transition-colors duration-150"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-content-primary truncate">
                                                    {job.name}
                                                </span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${styles.bg} ${styles.text}`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-content-muted font-mono mt-1">
                                                {formatTime(job.lastRun)}
                                            </p>
                                        </div>
                                        {job.error && (
                                            <span className="text-xs text-status-error truncate max-w-24 ml-2">
                                                {job.error}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
