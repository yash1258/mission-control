'use client';

import { Terminal, Brain, Clock, Activity, LucideIcon } from 'lucide-react';
import type { StatusLevel } from '@/lib/types';

interface StatusCardProps {
    title: 'Gateway' | 'QMD Memory' | 'Cron Jobs' | 'Active Session';
    value: string | number;
    subtitle?: string;
    status: StatusLevel;
    icon: 'terminal' | 'brain' | 'clock' | 'activity';
    warning?: string;
}

const iconMap: Record<string, LucideIcon> = {
    terminal: Terminal,
    brain: Brain,
    clock: Clock,
    activity: Activity,
};

const statusStyles: Record<StatusLevel, { dot: string; text: string; glow: string }> = {
    online: {
        dot: 'bg-status-online',
        text: 'text-status-online',
        glow: 'status-glow-green',
    },
    warning: {
        dot: 'bg-status-warning',
        text: 'text-status-warning',
        glow: 'status-glow-yellow',
    },
    error: {
        dot: 'bg-status-error',
        text: 'text-status-error',
        glow: 'status-glow-red',
    },
    unknown: {
        dot: 'bg-content-muted',
        text: 'text-content-muted',
        glow: '',
    },
};

export default function StatusCard({
    title,
    value,
    subtitle,
    status,
    icon,
    warning
}: StatusCardProps) {
    const Icon = iconMap[icon];
    const styles = statusStyles[status];

    return (
        <div className="relative bg-base-elevated border border-border-subtle rounded-xl p-5 
                    card-hover overflow-hidden">
            {/* Icon and Title */}
            <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-5 h-5 ${styles.text}`} />
                <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                    {title}
                </span>
            </div>

            {/* Main Value */}
            <div className="mb-2">
                <span className={`text-xl font-bold ${styles.text}`}>
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
                <p className="text-xs text-status-warning mt-2 font-mono">
                    ⚠ {warning}
                </p>
            )}

            {/* Status Indicator */}
            <div
                className={`absolute bottom-4 right-4 w-2 h-2 rounded-full ${styles.dot} ${styles.glow}`}
                title={status}
            />
        </div>
    );
}
