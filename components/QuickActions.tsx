'use client';

import { RotateCcw, Newspaper, Twitter, Brain, FileText, Loader2 } from 'lucide-react';
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
}

const actions: ActionButton[] = [
    {
        id: 'restart-gateway',
        label: 'Restart',
        sublabel: 'Gateway',
        icon: RotateCcw,
        destructive: true,
    },
    {
        id: 'run-news-scout',
        label: 'News',
        sublabel: 'Scout',
        icon: Newspaper,
    },
    {
        id: 'run-twitter-pipeline',
        label: 'Twitter',
        sublabel: 'Pipeline',
        icon: Twitter,
    },
    {
        id: 'reindex-qmd',
        label: 'Reindex',
        sublabel: 'QMD',
        icon: Brain,
    },
    {
        id: 'check-logs',
        label: 'Check',
        sublabel: 'Logs',
        icon: FileText,
    },
];

export default function QuickActions({ onAction, loadingAction }: QuickActionsProps) {
    return (
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
              flex flex-col items-center justify-center gap-2 p-4
              bg-base-elevated border border-border-subtle rounded-xl
              transition-all duration-150 ease-out
              btn-lift
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              group
              ${action.destructive
                                ? 'hover:border-status-error/50'
                                : 'hover:border-border hover:bg-base-surface'
                            }
            `}
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 text-content-secondary animate-spin" />
                        ) : (
                            <Icon
                                className={`w-6 h-6 text-content-secondary transition-colors duration-150
                           ${action.destructive
                                        ? 'group-hover:text-status-error'
                                        : 'group-hover:text-accent-purple'
                                    }`}
                            />
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
                    </button>
                );
            })}
        </div>
    );
}
