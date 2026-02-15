import { exec } from 'child_process';
import { promisify } from 'util';
import type {
    CLIResult,
    GatewayStatus,
    QMDStatus,
    Session,
    CronJob,
    CronRun,
    ErrorLog
} from './types';

const execAsync = promisify(exec);

// Configuration
const CLI_TIMEOUT = 30000; // 30 seconds
const CLI_ENCODING = 'utf-8';

// Execute a CLI command with timeout
export async function executeCommand(
    command: string,
    timeout = CLI_TIMEOUT
): Promise<CLIResult> {
    try {
        const { stdout, stderr } = await execAsync(command, {
            encoding: CLI_ENCODING,
            timeout,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });

        return {
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: 0,
        };
    } catch (error: unknown) {
        const err = error as { stdout?: string; stderr?: string; message?: string; code?: number };
        return {
            stdout: err.stdout?.trim() || '',
            stderr: err.stderr?.trim() || err.message || 'Unknown error',
            exitCode: err.code || 1,
        };
    }
}

// Helper to extract value from "Key: Value" format
function extractValue(line?: string): string | null {
    if (!line) return null;
    const parts = line.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : null;
}

// Parse Gateway Status
export function parseGatewayStatus(result: CLIResult): GatewayStatus {
    // Try JSON parse first
    try {
        const json = JSON.parse(result.stdout);
        return {
            status: json.status || 'unknown',
            uptime: json.uptime || 'N/A',
            lastRestart: json.lastRestart || 'N/A',
            version: json.version,
        };
    } catch {
        // Fall back to text parsing
        const lines = result.stdout.split('\n');
        const statusLine = lines.find(l => l.toLowerCase().includes('status'));
        const uptimeLine = lines.find(l => l.toLowerCase().includes('uptime'));
        const restartLine = lines.find(l => l.toLowerCase().includes('restart'));

        const status = statusLine?.includes('online') ? 'online' :
            statusLine?.includes('offline') ? 'offline' : 'unknown';

        return {
            status,
            uptime: extractValue(uptimeLine) || 'N/A',
            lastRestart: extractValue(restartLine) || 'N/A',
        };
    }
}

// Parse QMD Status
export function parseQMDStatus(result: CLIResult): QMDStatus {
    const now = new Date();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours in ms

    try {
        const json = JSON.parse(result.stdout);
        const lastUpdated = new Date(json.lastUpdated);
        const stale = !isNaN(lastUpdated.getTime()) &&
            (now.getTime() - lastUpdated.getTime()) > staleThreshold;

        return {
            filesIndexed: json.filesIndexed || 0,
            vectors: json.vectors || 0,
            lastUpdated: json.lastUpdated || 'N/A',
            stale,
            status: stale ? 'stale' : (json.status || 'healthy'),
        };
    } catch {
        // Text parsing fallback
        const filesMatch = result.stdout.match(/files[:\s]+(\d+)/i);
        const vectorsMatch = result.stdout.match(/vectors[:\s]+(\d+)/i);
        const updatedMatch = result.stdout.match(/last updated[:\s]+(.+)/i);

        const lastUpdated = updatedMatch?.[1]?.trim() || 'N/A';
        const lastUpdatedDate = new Date(lastUpdated);
        const stale = !isNaN(lastUpdatedDate.getTime()) &&
            (now.getTime() - lastUpdatedDate.getTime()) > staleThreshold;

        return {
            filesIndexed: parseInt(filesMatch?.[1] || '0'),
            vectors: parseInt(vectorsMatch?.[1] || '0'),
            lastUpdated,
            stale,
            status: result.stdout.toLowerCase().includes('error') ? 'error' :
                stale ? 'stale' : 'healthy',
        };
    }
}

// Parse Sessions List
export function parseSessionsList(result: CLIResult): Session[] {
    // Empty state check
    if (result.stdout.toLowerCase().includes('no active sessions') ||
        result.stdout.trim() === '') {
        return [];
    }

    try {
        const json = JSON.parse(result.stdout);
        return (json.sessions || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            label: s.label as string | undefined,
            platform: s.platform as string,
            model: s.model as string,
            status: s.status as Session['status'],
            task: s.task as string | undefined,
            startedAt: s.startedAt as string,
            isolated: (s.isolated as boolean) || false,
            connected: (s.connected as boolean) ?? true,
        }));
    } catch {
        // Table parsing fallback
        const lines = result.stdout.split('\n').filter(l => l.trim());
        if (lines.length < 2) return [];

        // Skip header line, parse data rows
        return lines.slice(1).map(line => {
            const cols = line.split(/\s+/);
            return {
                id: cols[0] || 'unknown',
                platform: cols[1] || 'unknown',
                model: cols[2] || 'unknown',
                status: (cols[3] || 'unknown') as Session['status'],
                isolated: cols[4] === 'yes',
                startedAt: new Date().toISOString(),
                connected: true,
            };
        });
    }
}

// Parse Cron List
export function parseCronList(result: CLIResult): CronJob[] {
    try {
        const json = JSON.parse(result.stdout);
        return (json.jobs || []).map((job: Record<string, unknown>) => ({
            id: job.id as string,
            name: job.name as string,
            schedule: job.schedule as string,
            nextRun: (job.nextRun as string) || 'N/A',
            lastRun: (job.lastRun as string) || 'Never',
            status: job.enabled ? ((job.status as string) || 'ok') : 'disabled',
            error: job.error as string | undefined,
            enabled: (job.enabled as boolean) ?? true,
        }));
    } catch {
        // Fallback parsing if JSON flag not supported
        const lines = result.stdout.split('\n').filter(l => l.trim());
        return lines.map(line => {
            const parts = line.split(/\s{2,}/); // Split on 2+ spaces
            return {
                id: parts[0] || 'unknown',
                name: parts[1] || 'Unknown Job',
                schedule: parts[2] || 'N/A',
                nextRun: parts[3] || 'N/A',
                lastRun: parts[4] || 'Never',
                status: parts[5]?.toLowerCase().includes('error') ? 'error' : 'ok',
                enabled: true,
            };
        });
    }
}

// Parse Cron Runs
export function parseCronRuns(result: CLIResult): CronRun[] {
    try {
        const json = JSON.parse(result.stdout);
        return (json.runs || []).map((run: Record<string, unknown>) => ({
            id: run.id as string,
            jobId: run.jobId as string,
            startedAt: run.startedAt as string,
            completedAt: run.completedAt as string | undefined,
            duration: run.duration as string | undefined,
            status: run.status as CronRun['status'],
            error: run.error as string | undefined,
            itemsProcessed: run.itemsProcessed as number | undefined,
        }));
    } catch {
        return [];
    }
}

// Parse Error Logs
export function parseErrorLogs(result: CLIResult, source: string): ErrorLog[] {
    try {
        const json = JSON.parse(result.stdout);
        return (json.logs || json.errors || []).map((log: Record<string, unknown>) => ({
            timestamp: (log.timestamp || log.time || new Date().toISOString()) as string,
            source: (log.source || source) as ErrorLog['source'],
            type: (log.type || log.level || 'UnknownError') as string,
            message: (log.message || log.msg || 'Unknown error') as string,
        }));
    } catch {
        // Text parsing fallback
        const lines = result.stdout.split('\n').filter(l =>
            l.toLowerCase().includes('error') ||
            l.toLowerCase().includes('fail')
        );

        return lines.map(line => {
            const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/);
            return {
                timestamp: timestampMatch?.[0] || new Date().toISOString(),
                source: source as ErrorLog['source'],
                type: 'Error',
                message: line.trim(),
            };
        });
    }
}

// Parse Action Result
export function parseActionResult(result: CLIResult, action: string): { success: boolean; result?: string; error?: string } {
    if (result.exitCode === 0) {
        return {
            success: true,
            result: result.stdout || `${action} completed successfully`,
        };
    }

    return {
        success: false,
        error: result.stderr || result.stdout || `${action} failed with exit code ${result.exitCode}`,
    };
}
