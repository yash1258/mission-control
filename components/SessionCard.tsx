'use client';

import { MessageCircle, Hash, Slack, Globe, Code, MessageSquare, Clock, User, Bot } from 'lucide-react';
import type { GatewaySession } from '@/lib/openclaw-types';
import { getProviderColor } from '@/lib/openclaw-rpc';

interface SessionCardProps {
    session: GatewaySession;
    timeAgo?: string;
    onClick?: () => void;
}

// Provider icon mapping
const ProviderIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    telegram: MessageCircle,
    discord: Hash,
    slack: Slack,
    whatsapp: MessageCircle,
    web: Globe,
    api: Code,
};

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function SessionCard({ session, timeAgo, onClick }: SessionCardProps) {
    const provider = session.origin?.provider || 'unknown';
    const ProviderIcon = ProviderIcons[provider.toLowerCase()] || MessageSquare;
    const providerColor = getProviderColor(provider);

    const displayTime = timeAgo || formatTimeAgo(session.updatedAt);

    return (
        <div
            onClick={onClick}
            className={`group relative bg-base-elevated border border-border-subtle rounded-lg p-4 
                       hover:border-border-default transition-all duration-200
                       ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
        >
            {/* Provider accent line */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                style={{ backgroundColor: providerColor }}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: `${providerColor}20` }}
                    >
                        <ProviderIcon
                            className="w-4 h-4"
                            style={{ color: providerColor }}
                        />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-content-primary">
                            {session.sessionId.slice(0, 12)}...
                        </span>
                        {session.agent && (
                            <Bot className="inline-block w-3 h-3 ml-1 text-status-online" />
                        )}
                    </div>
                </div>

                {/* Kind badge */}
                <span className={`px-2 py-0.5 text-xs rounded-full ${session.kind === 'direct'
                    ? 'bg-status-online/10 text-status-online'
                    : 'bg-status-warning/10 text-status-warning'
                    }`}>
                    {session.kind}
                </span>
            </div>

            {/* Origin info */}
            <div className="flex items-center gap-2 text-xs text-content-muted mb-2">
                <span className="capitalize">{session.origin?.channel || 'Unknown'}</span>
                <span>•</span>
                <span className="capitalize">{provider}</span>
                {session.origin?.userId && (
                    <>
                        <span>•</span>
                        <User className="w-3 h-3" />
                        <span>{session.origin.userId.slice(0, 8)}</span>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-content-muted">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{displayTime}</span>
                </div>

                {session.agentId && (
                    <div className="flex items-center gap-1 text-status-online">
                        <Bot className="w-3 h-3" />
                        <span>Agent active</span>
                    </div>
                )}
            </div>

            {/* Hover indicator */}
            {onClick && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-content-primary/5 
                              opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
            )}
        </div>
    );
}