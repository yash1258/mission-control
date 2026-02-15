'use client';

import { RotateCcw, Newspaper, Twitter, Brain, FileText, Loader2, Zap } from 'lucide-react';
import type { ActionType } from '@/lib/types';

interface QuickActionsProps {
    onAction: (action: ActionType) => void;
    loadingAction: ActionType | null;
}

interface ActionButton {
    id: ActionType;
    label: string;
    sublabel: string;
    icon: typeof RotateCcw;
    destructive?: boolean;
    gradient: string;
}

const actions: ActionButton[] = [
    {
        id: 'restart-gateway',
        label: 'Restart',
        sublabel: 'Gateway',
        icon: RotateCcw,
        destructive: true,
        gradient: 'from-status-error/20 to-status-error/5',
    },
    {
        id: 'run-news-scout',
        label: 'News',
        sublabel: 'Scout',
        icon: Newspaper,
        gradient: 'from-accent-purple/20 to-accent-purple/5',
    },
    {
        id: 'run-twitter-pipeline',
        label: 'Twitter',
        sublabel: 'Pipeline',
        icon: Twitter,
        gradient: 'from-accent-cyan/20 to-accent-cyan/5',
    },
    {
        id: 'reindex-qmd',
        label: 'Reindex',
        sublabel: 'QMD',
        icon: Brain,
        gradient: 'from-accent-pink/20 to-accent-pink/5',
    },
    {
        id: 'check-logs',
        label: 'Check',
        sublabel: 'Logs',
        icon: FileText,
        gradient: 'from-status-info/20 to-status-info/5',
    },
];

export default function QuickActions({ onAction, loadingAction }: QuickActionsProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-purple" />
                <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wide">
                    Quick Actions
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {actions.map((action) => {
                    const Icon = action.icon;
                    const isLoading = loadingAction === action.id;

                    return (
                        <button
                            key={action.id}
                            onClick={() => onAction(action.id)}
                            disabled={isLoading}
                            className={`
                relative flex flex-col items-center justify-center gap-2 p-4
                bg-base-elevated border border-border-subtle rounded-xl
                transition-all duration-150 ease-out
                btn-lift overflow-hidden
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                group
                ${action.destructive
                                    ? 'hover:border-status-error/50 hover:shadow-status-error/10'
                                    : 'hover:border-accent-purple/50 hover:shadow-accent-purple/10'
                                }
                hover:shadow-lg
              `}
                        >
                            {/* Gradient background on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            {/* Content */}
                            <div className="relative z-10 flex flex-col items-center gap-2">
                                {isLoading ? (
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-content-secondary animate-spin" />
                                    </div>
                                ) : (
                                    <div className={`p-2 rounded-lg transition-colors duration-150
                                  ${action.destructive
                                            ? 'bg-status-error/10 group-hover:bg-status-error/20'
                                            : 'bg-base-surface group-hover:bg-accent-purple/10'
                                        }`}>
                                        <Icon
                                            className={`w-5 h-5 transition-colors duration-150
                                ${action.destructive
                                                    ? 'text-status-error'
                                                    : 'text-content-secondary group-hover:text-accent-purple'
                                                }`}
                                        />
                                    </div>
                                )}
                                <div className="text-center">
                                    <span className={`block text-sm font-medium text-content-secondary
                                   transition-colors duration-150
                                   group-hover:text-content-primary`}>
                                        {action.label}
                                    </span>
                                    <span className="block text-xs text-content-muted">
                                        {action.sublabel}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
