'use client';

import { RefreshCw } from 'lucide-react';

interface HeaderProps {
    lastUpdated: string | null;
    isLoading: boolean;
    onRefresh: () => void;
}

export default function Header({ lastUpdated, isLoading, onRefresh }: HeaderProps) {
    const formatLastUpdated = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins === 1) return '1m ago';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return '1h ago';
        return `${diffHours}h ago`;
    };

    return (
        <header className="mb-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary tracking-tight">
                        <span className="mr-2">🖤</span>
                        Mission Control
                    </h1>
                    <p className="text-sm text-content-muted font-mono mt-1">
                        Renoa's command center
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {lastUpdated && (
                        <div className="flex items-center gap-2 text-xs text-content-muted">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
                            <span className="font-mono">
                                {formatLastUpdated(lastUpdated)}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 rounded-lg bg-base-elevated border border-border-subtle
                       hover:border-border hover:bg-base-surface
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-150 ease-out group"
                        title="Refresh"
                    >
                        <RefreshCw
                            className={`w-4 h-4 text-content-secondary group-hover:text-accent-purple
                         transition-colors duration-150
                         ${isLoading ? 'animate-spin' : ''}`}
                        />
                    </button>
                </div>
            </div>
        </header>
    );
}
