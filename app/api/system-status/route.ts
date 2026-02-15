import { NextResponse } from 'next/server';
import { executeCommand, parseGatewayStatus, parseQMDStatus, parseSessionsList } from '@/lib/cli';
import type { SystemStatus } from '@/lib/types';

export async function GET() {
    try {
        // Execute commands in parallel for efficiency
        const [gatewayResult, qmdResult, sessionsResult] = await Promise.all([
            executeCommand('openclaw gateway status'),
            executeCommand('qmd status'),
            executeCommand('openclaw sessions list'),
        ]);

        // Parse results
        const gateway = parseGatewayStatus(gatewayResult);
        const memory = parseQMDStatus(qmdResult);
        const sessions = parseSessionsList(sessionsResult);

        // Find the main session (non-isolated, connected)
        const mainSession = sessions.find(s => !s.isolated && s.connected) || sessions[0];

        const systemStatus: SystemStatus = {
            gateway,
            memory,
            sessions: {
                platform: mainSession?.platform || 'none',
                model: mainSession?.model || 'N/A',
                connected: !!mainSession?.connected,
            },
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(systemStatus);
    } catch (error) {
        console.error('Error fetching system status:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch system status',
                gateway: { status: 'unknown', uptime: 'N/A', lastRestart: 'N/A' },
                memory: { filesIndexed: 0, vectors: 0, lastUpdated: 'N/A', stale: true, status: 'error' },
                sessions: { platform: 'none', model: 'N/A', connected: false },
                lastUpdated: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
