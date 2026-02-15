'use client';

import { AlertCircle } from 'lucide-react';
import type { ErrorLog } from '@/lib/types';

interface RecentErrorsProps {
    errors: ErrorLog[];
    isLoading?: boolean;
}

const sourceStyles = {
    gateway: { text: 'text-accent-purple', bg: 'bg-accent-purple/10' },
    cron: { text: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
    qmd: { text: 'text-accent-pink', bg: 'bg-accent-pink/10' },
    unknown: { text: 'text-content-muted', bg: 'bg-base-surface' },
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
        <div className="bg-base-elevated border border-border-subtle rounded-xl overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 
                      border-b border-border-subtle
                      bg-gradient-to-b from-base-surface to-transparent">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-content-muted" />
                    <span className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
                        Recent Errors
                    </span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full 
                         bg-status-error/20 text-status-error">
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
                    <div className="text-center py-8 text-content-muted text-sm">
                        <span className="text-status-online">✓</span> No errors in last 24h
                    </div>
                ) : (
                    <div className="space-y-2">
                        {errors.slice(0, 6).map((error, index) => {
                            const styles = sourceStyles[error.source];
                            return (
                                <div
                                    key={`${error.timestamp}-${index}`}
                                    className="p-3 rounded-lg hover:bg-base-surface 
                             transition-colors duration-150 border-l-2 
                             border-status-error/50"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${styles.bg} ${styles.text}`}>
                                                    {error.source}
                                                </span>
                                                <span className="text-xs text-content-muted font-mono">
                                                    {error.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-content-secondary truncate mt-1">
                                                {error.message}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-content-muted font-mono">
                                                {formatTime(error.timestamp)}
                                            </p>
                                            <p className="text-xs text-content-muted">
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
