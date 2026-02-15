import { NextResponse } from 'next/server';
import { executeCommand, parseSessionsList } from '@/lib/cli';
import type { ActiveAgents, ActiveAgent } from '@/lib/types';

export async function GET() {
    try {
        // Get all sessions
        const sessionsResult = await executeCommand('openclaw sessions list');
        const sessions = parseSessionsList(sessionsResult);

        // Filter for isolated sessions (agents/sub-sessions)
        const activeAgents: ActiveAgent[] = sessions
            .filter(s => s.isolated)
            .map(s => ({
                id: s.id,
                label: s.label || s.id,
                status: s.status === 'active' ? 'running' : s.status,
                task: s.task || 'Unknown task',
                startedAt: s.startedAt,
            }));

        const response: ActiveAgents = {
            agents: activeAgents,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching active agents:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch active agents',
                agents: [],
            },
            { status: 500 }
        );
    }
}
