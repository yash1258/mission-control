'use client';

import { Zap } from 'lucide-react';
import type { ActiveAgent } from '@/lib/types';

interface RunningAgentsProps {
    agents: ActiveAgent[];
    isLoading?: boolean;
}

const statusStyles = {
    running: { dot: 'bg-status-online', text: 'text-status-online' },
    idle: { dot: 'bg-content-muted', text: 'text-content-muted' },
    error: { dot: 'bg-status-error', text: 'text-status-error' },
};

function formatTimeAgo(timestamp: string): string {
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
}

export default function RunningAgents({ agents, isLoading }: RunningAgentsProps) {
    return (
        <div className="bg-base-elevated border border-border-subtle rounded-xl overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 
                      border-b border-border-subtle
                      bg-gradient-to-b from-base-surface to-transparent">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-content-muted" />
                    <span className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
                        Running Agents
                    </span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full 
                         bg-base-surface text-content-muted">
                    {agents.length} active
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
                ) : agents.length === 0 ? (
                    <div className="text-center py-8 text-content-muted text-sm">
                        No active agents
                    </div>
                ) : (
                    <div className="space-y-2">
                        {agents.map((agent, index) => {
                            const styles = statusStyles[agent.status];
                            return (
                                <div
                                    key={agent.id}
                                    className="p-3 rounded-lg hover:bg-base-surface 
                             transition-colors duration-150"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-content-primary truncate">
                                                    {agent.label}
                                                </span>
                                                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                                            </div>
                                            <p className="text-sm text-content-secondary truncate mt-0.5">
                                                {agent.task}
                                            </p>
                                            <p className="text-xs text-content-muted font-mono mt-1">
                                                Started {formatTimeAgo(agent.startedAt)}
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
