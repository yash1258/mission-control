'use client';

import { RefreshCw, Radio } from 'lucide-react';

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
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-content-primary tracking-tight">
                            <span className="mr-2">🖤</span>
                            Mission Control
                        </h1>
                        <div className="live-indicator text-xs text-status-online font-medium">
                            LIVE
                        </div>
                    </div>
                    <p className="text-sm text-content-muted font-mono mt-1">
                        Renoa's command center
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {lastUpdated && (
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg 
                           bg-base-elevated border border-border-subtle">
                            <div className="flex items-center gap-2">
                                <Radio className="w-3 h-3 text-status-online" />
                                <span className="text-xs text-content-muted font-mono">
                                    {formatLastUpdated(lastUpdated)}
                                </span>
                            </div>
                            <div className="w-px h-4 bg-border" />
                            <button
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="p-1 rounded-md hover:bg-base-surface
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-150 group"
                                title="Refresh"
                            >
                                <RefreshCw
                                    className={`w-3.5 h-3.5 text-content-secondary group-hover:text-accent-purple
                             transition-colors duration-150
                             ${isLoading ? 'animate-spin' : ''}`}
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle divider with gradient */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </header>
    );
}
