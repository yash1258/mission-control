'use client';

import { Zap, Sparkles } from 'lucide-react';
import type { ActiveAgent } from '@/lib/types';

interface RunningAgentsProps {
    agents: ActiveAgent[];
    isLoading?: boolean;
}

const statusStyles = {
    running: {
        dot: 'bg-status-online',
        text: 'text-status-online',
        bg: 'bg-status-online/10',
        ring: 'activity-ring',
    },
    idle: {
        dot: 'bg-content-muted',
        text: 'text-content-muted',
        bg: 'bg-base-surface',
        ring: '',
    },
    error: {
        dot: 'bg-status-error',
        text: 'text-status-error',
        bg: 'bg-status-error/10',
        ring: '',
    },
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
        <div className="bg-base-elevated border border-border-subtle rounded-xl overflow-hidden h-full shimmer-border">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 
                      border-b border-border-subtle panel-header-gradient">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent-purple/10">
                        <Zap className="w-3.5 h-3.5 text-accent-purple" />
                    </div>
                    <span className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
                        Running Agents
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {agents.length > 0 && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full 
                           bg-accent-purple/10 text-accent-purple">
                            <Sparkles className="w-3 h-3" />
                            {agents.length} active
                        </span>
                    )}
                </div>
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
                    <div className="flex flex-col items-center justify-center py-8 text-content-muted">
                        <div className="w-12 h-12 rounded-full bg-base-surface flex items-center justify-center mb-3">
                            <Zap className="w-5 h-5 text-content-muted" />
                        </div>
                        <span className="text-sm">No active agents</span>
                        <span className="text-xs text-content-muted mt-1">Agents will appear here when running</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {agents.map((agent, index) => {
                            const styles = statusStyles[agent.status];
                            return (
                                <div
                                    key={agent.id}
                                    className="group p-3 rounded-lg hover:bg-base-surface 
                             transition-all duration-150 border border-transparent 
                             hover:border-border-subtle"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${styles.dot} ${styles.ring}`}
                                                    style={{ color: agent.status === 'running' ? '#4ade80' : undefined }} />
                                                <span className="font-medium text-content-primary truncate group-hover:text-accent-purple transition-colors">
                                                    {agent.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-content-secondary truncate mt-1 pl-4">
                                                {agent.task}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 pl-4">
                                                <span className="text-xs text-content-muted font-mono">
                                                    Started {formatTimeAgo(agent.startedAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-xs font-medium ${styles.bg} ${styles.text}`}>
                                            {agent.status}
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
