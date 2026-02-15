'use client';

import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { CronJob } from '@/lib/types';

interface CronResultsProps {
    jobs: CronJob[];
    isLoading?: boolean;
}

const statusConfig = {
    ok: {
        icon: CheckCircle,
        text: 'text-status-online',
        bg: 'bg-status-online/10',
        border: 'border-status-online/20',
        animate: '',
    },
    error: {
        icon: XCircle,
        text: 'text-status-error',
        bg: 'bg-status-error/10',
        border: 'border-status-error/20',
        animate: '',
    },
    running: {
        icon: Loader2,
        text: 'text-status-info',
        bg: 'bg-status-info/10',
        border: 'border-status-info/20',
        animate: 'animate-spin',
    },
    disabled: {
        icon: Clock,
        text: 'text-content-muted',
        bg: 'bg-base-surface',
        border: 'border-border-subtle',
        animate: '',
    },
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
        <div className="bg-base-elevated border border-border-subtle rounded-xl overflow-hidden h-full shimmer-border">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 
                      border-b border-border-subtle panel-header-gradient">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent-cyan/10">
                        <Clock className="w-3.5 h-3.5 text-accent-cyan" />
                    </div>
                    <span className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
                        Recent Cron Results
                    </span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full 
                         bg-base-surface text-content-muted border border-border-subtle">
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
                    <div className="flex flex-col items-center justify-center py-8 text-content-muted">
                        <div className="w-12 h-12 rounded-full bg-base-surface flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-content-muted" />
                        </div>
                        <span className="text-sm">No recent cron runs</span>
                        <span className="text-xs text-content-muted mt-1">Runs will appear here when executed</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentRuns.map((job, index) => {
                            const config = statusConfig[job.status];
                            const StatusIcon = config.icon;

                            return (
                                <div
                                    key={job.id}
                                    className="group p-3 rounded-lg hover:bg-base-surface 
                             transition-all duration-150 border border-transparent 
                             hover:border-border-subtle"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className={`w-4 h-4 ${config.text} ${config.animate}`} />
                                                <span className="font-medium text-content-primary truncate group-hover:text-accent-cyan transition-colors">
                                                    {job.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5 pl-6">
                                                <span className="text-xs text-content-muted font-mono">
                                                    {formatTime(job.lastRun)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                                            {job.status}
                                        </div>
                                    </div>
                                    {job.error && (
                                        <div className="mt-2 pl-6 text-xs text-status-error bg-status-error/5 rounded p-2 font-mono">
                                            {job.error}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
