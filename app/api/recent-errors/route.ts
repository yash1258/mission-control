import { NextResponse } from 'next/server';
import { executeCommand, parseErrorLogs } from '@/lib/cli';
import type { RecentErrors } from '@/lib/types';

export async function GET() {
    try {
        // Fetch errors from multiple sources in parallel
        const [gatewayErrors, cronErrors, qmdErrors] = await Promise.all([
            executeCommand('openclaw gateway logs --errors --since 24h'),
            executeCommand('openclaw cron logs --errors --since 24h'),
            executeCommand('qmd logs --errors --since 24h'),
        ]);

        // Parse and combine errors
        const allErrors = [
            ...parseErrorLogs(gatewayErrors, 'gateway'),
            ...parseErrorLogs(cronErrors, 'cron'),
            ...parseErrorLogs(qmdErrors, 'qmd'),
        ];

        // Sort by timestamp (most recent first) and limit to 20
        const sortedErrors = allErrors
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);

        const recentErrors: RecentErrors = {
            errors: sortedErrors,
        };

        return NextResponse.json(recentErrors);
    } catch (error) {
        console.error('Error fetching recent errors:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch recent errors',
                errors: [],
            },
            { status: 500 }
        );
    }
}
