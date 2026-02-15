import { NextRequest, NextResponse } from 'next/server';
import { executeCommand, parseActionResult } from '@/lib/cli';
import type { ActionRequest, ActionType } from '@/lib/types';

// Map action types to CLI commands
const ACTION_COMMANDS: Record<ActionType, string> = {
    'restart-gateway': 'openclaw gateway restart',
    'run-news-scout': 'openclaw cron run cron_news_scout',
    'run-twitter-pipeline': 'openclaw cron run cron_twitter',
    'reindex-qmd': 'qmd update && qmd embed',
    'check-logs': 'openclaw logs --tail 50',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ActionRequest;
        const { action } = body;

        // Validate action
        if (!action || !ACTION_COMMANDS[action]) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid action: ${action}. Valid actions are: ${Object.keys(ACTION_COMMANDS).join(', ')}`
                },
                { status: 400 }
            );
        }

        // Execute the command
        const command = ACTION_COMMANDS[action];
        const result = await executeCommand(command, 60000); // 60s timeout for actions

        // Parse and return result
        const actionResult = parseActionResult(result, action);

        return NextResponse.json(actionResult);
    } catch (error) {
        console.error('Error executing action:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}
