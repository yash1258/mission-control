'use client';

import { useState } from 'react';
import { Clock, Play, Pause, Loader2, CheckCircle, AlertCircle, Bot, RefreshCw } from 'lucide-react';
import type { GatewayCronJob } from '@/lib/openclaw-types';
import { formatSchedule, getCronJobStatus } from '@/lib/openclaw-rpc';

interface CronJobCardProps {
    job: GatewayCronJob;
    onToggle?: (enabled: boolean) => void;
    onRun?: () => void;
    isUpdating?: boolean;
}

export default function CronJobCard({ job, onToggle, onRun, isUpdating }: CronJobCardProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const { status, color, icon } = getCronJobStatus(job);
    const scheduleDisplay = formatSchedule(job.schedule);

    const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
        green: { bg: 'bg-status-online/10', text: 'text-status-online', dot: 'bg-status-online' },
        red: { bg: 'bg-status-error/10', text: 'text-status-error', dot: 'bg-status-error' },
        blue: { bg: 'bg-status-online/10', text: 'text-status-online', dot: 'bg-status-online' },
        gray: { bg: 'bg-base-surface', text: 'text-content-muted', dot: 'bg-content-muted' },
    };

    const styles = statusColors[color];

    const handleToggle = () => {
        if (job.enabled && !showConfirm) {
            setShowConfirm(true);
            return;
        }
        setShowConfirm(false);
        onToggle?.(!job.enabled);
    };

    const handleRun = () => {
        onRun?.();
    };

    return (
        <div className={`group relative bg-base-elevated border border-border-subtle rounded-lg p-4 
                       transition-all duration-200 ${isUpdating ? 'opacity-60' : ''}`}>
            {/* Status accent line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${styles.dot}`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-content-primary truncate">
                            {job.name}
                        </h3>
                        {job.running && (
                            <Loader2 className="w-3 h-3 animate-spin text-status-online flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-content-muted font-mono">
                        {job.id}
                    </p>
                </div>

                {/* Status badge */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${styles.bg}`}>
                    {icon === 'loader' && <Loader2 className={`w-3 h-3 animate-spin ${styles.text}`} />}
                    {icon === 'check' && <CheckCircle className={`w-3 h-3 ${styles.text}`} />}
                    {icon === 'alert-circle' && <AlertCircle className={`w-3 h-3 ${styles.text}`} />}
                    {icon === 'pause' && <Pause className={`w-3 h-3 ${styles.text}`} />}
                    <span className={`text-xs ${styles.text} capitalize`}>{status}</span>
                </div>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-content-muted" />
                <span className="text-xs text-content-secondary font-mono">
                    {scheduleDisplay}
                </span>
            </div>

            {/* Agent info */}
            {job.agent && (
                <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-base-surface rounded-md">
                    <Bot className="w-3.5 h-3.5 text-status-online" />
                    <span className="text-xs text-content-secondary">
                        Agent: <span className="text-content-primary">{job.agent.name}</span>
                    </span>
                </div>
            )}

            {/* Last run info */}
            {job.lastRun && (
                <div className={`text-xs mb-3 ${job.lastRun.status === 'error' ? 'text-status-error' : 'text-content-muted'}`}>
                    Last run: {job.lastRun.status === 'ok' ? '✓' : '✗'}
                    {job.lastRun.error && (
                        <span className="block mt-1 text-status-error truncate" title={job.lastRun.error}>
                            {job.lastRun.error}
                        </span>
                    )}
                </div>
            )}

            {/* Next run */}
            {job.nextRun && job.enabled && (
                <div className="text-xs text-content-muted mb-3">
                    Next: {new Date(job.nextRun).toLocaleString()}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                {/* Toggle button */}
                <button
                    onClick={handleToggle}
                    disabled={isUpdating || job.running}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md 
                              transition-colors ${job.enabled
                            ? 'bg-status-warning/10 text-status-warning hover:bg-status-warning/20'
                            : 'bg-status-online/10 text-status-online hover:bg-status-online/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isUpdating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : job.enabled ? (
                        <Pause className="w-3 h-3" />
                    ) : (
                        <Play className="w-3 h-3" />
                    )}
                    {job.enabled ? 'Disable' : 'Enable'}
                </button>

                {/* Run now button */}
                {job.enabled && (
                    <button
                        onClick={handleRun}
                        disabled={isUpdating || job.running}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md 
                                 bg-base-surface text-content-secondary hover:text-content-primary
                                 hover:bg-base-surface/80 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {job.running ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3" />
                        )}
                        Run now
                    </button>
                )}
            </div>

            {/* Confirm disable dialog */}
            {showConfirm && (
                <div className="absolute inset-0 bg-base-elevated/95 rounded-lg flex flex-col 
                              items-center justify-center p-4 z-10">
                    <p className="text-sm text-content-primary mb-3 text-center">
                        Disable "{job.name}"?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="px-3 py-1.5 text-xs bg-base-surface text-content-secondary 
                                     rounded-md hover:bg-base-surface/80"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleToggle}
                            className="px-3 py-1.5 text-xs bg-status-warning/10 text-status-warning 
                                     rounded-md hover:bg-status-warning/20"
                        >
                            Disable
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}