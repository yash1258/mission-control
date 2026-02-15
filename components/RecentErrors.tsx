'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { ErrorLog } from '@/lib/types';

interface RecentErrorsProps {
    errors: ErrorLog[];
    isLoading?: boolean;
}

const sourceConfig = {
    gateway: {
        text: 'text-accent-purple',
        bg: 'bg-accent-purple/10',
        border: 'border-accent-purple/30',
        icon: AlertCircle,
    },
    cron: {
        text: 'text-accent-cyan',
        bg: 'bg-accent-cyan/10',
        border: 'border-accent-cyan/30',
        icon: AlertTriangle,
    },
    qmd: {
        text: 'text-accent-pink',
        bg: 'bg-accent-pink/10',
        border: 'border-accent-pink/30',
        icon: AlertCircle,
    },
    unknown: {
        text: 'text-content-muted',
        bg: 'bg-base-surface',
        border: 'border-border-subtle',
        icon: Info,
    },
};

function formatTime(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return '?';
    }
}

function formatDate(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        const now = new Date();

        if (date.toDateString() === now.toDateString()) {
            return 'Today';
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export default function RecentErrors({ errors, isLoading }: RecentErrorsProps) {
    return (
        <div className="bg-base-elevated border border-border-subtle rounded-xl overflow-hidden h-full shimmer-border">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 
                      border-b border-border-subtle panel-header-gradient">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-status-error/10">
                        <AlertCircle className="w-3.5 h-3.5 text-status-error" />
                    </div>
                    <span className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
                        Recent Errors
                    </span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full 
                         ${errors.length > 0
                        ? 'bg-status-error/20 text-status-error'
                        : 'bg-status-online/20 text-status-online'}`}>
                    {errors.length} in 24h
                </span>
            </div>

            {/* Content */}
            <div className="p-4 max-h-64 overflow-y-auto">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton h-16 w-full" />
                        ))}
                    </div>
                ) : errors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-content-muted">
                        <div className="w-12 h-12 rounded-full bg-status-online/10 flex items-center justify-center mb-3">
                            <span className="text-status-online text-xl">✓</span>
                        </div>
                        <span className="text-sm text-status-online font-medium">All clear!</span>
                        <span className="text-xs text-content-muted mt-1">No errors in last 24h</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {errors.slice(0, 6).map((error, index) => {
                            const config = sourceConfig[error.source];
                            const SourceIcon = config.icon;

                            return (
                                <div
                                    key={`${error.timestamp}-${index}`}
                                    className="group p-3 rounded-lg hover:bg-base-surface 
                             transition-all duration-150 border-l-2 
                             border-status-error/50 hover:border-status-error
                             bg-status-error/5"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <SourceIcon className={`w-3.5 h-3.5 ${config.text}`} />
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.text} font-medium`}>
                                                    {error.source}
                                                </span>
                                                <span className="text-xs text-content-muted font-mono bg-base-surface px-1.5 py-0.5 rounded">
                                                    {error.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-content-secondary truncate mt-1.5 pl-5 group-hover:text-content-primary transition-colors">
                                                {error.message}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-content-muted font-mono">
                                                {formatTime(error.timestamp)}
                                            </p>
                                            <p className="text-xs text-content-muted mt-0.5">
                                                {formatDate(error.timestamp)}
                                            </p>
                                        </div>
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
