'use client';

import { Terminal, Brain, Clock, Activity, LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import type { StatusLevel } from '@/lib/types';

interface StatusCardProps {
    title: 'Gateway' | 'QMD Memory' | 'Cron Jobs' | 'Active Session';
    value: string | number;
    subtitle?: string;
    status: StatusLevel;
    icon: 'terminal' | 'brain' | 'clock' | 'activity';
    warning?: string;
    trend?: 'up' | 'down' | 'neutral';
}

const iconMap: Record<string, LucideIcon> = {
    terminal: Terminal,
    brain: Brain,
    clock: Clock,
    activity: Activity,
};

const statusStyles: Record<StatusLevel, {
    dot: string;
    text: string;
    glow: string;
    accent: string;
    bg: string;
}> = {
    online: {
        dot: 'bg-status-online',
        text: 'text-status-online',
        glow: 'status-glow-green',
        accent: 'from-status-online/20 to-transparent',
        bg: 'bg-status-online/5',
    },
    warning: {
        dot: 'bg-status-warning',
        text: 'text-status-warning',
        glow: 'status-glow-yellow',
        accent: 'from-status-warning/20 to-transparent',
        bg: 'bg-status-warning/5',
    },
    error: {
        dot: 'bg-status-error',
        text: 'text-status-error',
        glow: 'status-glow-red',
        accent: 'from-status-error/20 to-transparent',
        bg: 'bg-status-error/5',
    },
    unknown: {
        dot: 'bg-content-muted',
        text: 'text-content-muted',
        glow: '',
        accent: 'from-content-muted/20 to-transparent',
        bg: 'bg-base-surface',
    },
};

export default function StatusCard({
    title,
    value,
    subtitle,
    status,
    icon,
    warning,
    trend
}: StatusCardProps) {
    const Icon = iconMap[icon];
    const styles = statusStyles[status];

    return (
        <div className={`relative bg-base-elevated border border-border-subtle rounded-xl p-5 
                    card-hover overflow-hidden shimmer-border
                    status-accent-line ${status}`}>
            {/* Background gradient accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.accent} opacity-50`} />

            {/* Top-right glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${styles.bg} blur-2xl opacity-30`} />

            {/* Content */}
            <div className="relative z-10">
                {/* Icon and Title */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${styles.bg}`}>
                            <Icon className={`w-4 h-4 ${styles.text}`} />
                        </div>
                        <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                            {title}
                        </span>
                    </div>

                    {/* Trend indicator */}
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-status-online' :
                                trend === 'down' ? 'text-status-error' : 'text-content-muted'
                            }`}>
                            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                        </div>
                    )}
                </div>

                {/* Main Value */}
                <div className="mb-2">
                    <span className={`text-2xl font-bold ${styles.text} count-up`}>
                        {value}
                    </span>
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-sm text-content-secondary font-mono">
                        {subtitle}
                    </p>
                )}

                {/* Warning */}
                {warning && (
                    <div className="flex items-center gap-1.5 mt-3 px-2 py-1 rounded-md 
                          bg-status-warning/10 border border-status-warning/20">
                        <span className="text-xs text-status-warning font-medium">
                            ⚠ {warning}
                        </span>
                    </div>
                )}
            </div>

            {/* Status Indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${styles.dot} ${styles.glow} status-pulse`}
                    title={status} />
            </div>
        </div>
    );
}
