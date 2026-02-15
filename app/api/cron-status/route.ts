import { NextResponse } from 'next/server';
import { executeCommand, parseCronList, parseCronRuns } from '@/lib/cli';
import type { CronStatus, CronRun } from '@/lib/types';

export async function GET() {
    try {
        // Get list of cron jobs
        const cronListResult = await executeCommand('openclaw cron list --json');
        const jobs = parseCronList(cronListResult);

        // Get recent runs for each job (limit to first 4 jobs to avoid too many parallel requests)
        const jobsWithRuns = await Promise.all(
            jobs.slice(0, 4).map(async (job) => {
                const runsResult = await executeCommand(`openclaw cron runs ${job.id}`);
                const runs = parseCronRuns(runsResult);
                return { ...job, recentRuns: runs.slice(0, 4) };
            })
        );

        // Calculate statistics
        const activeCount = jobs.filter(j => j.enabled).length;
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get all runs from last 24h and count failures
        const allRuns: CronRun[] = [];
        for (const job of jobsWithRuns) {
            if (job.recentRuns) {
                allRuns.push(...job.recentRuns.filter(r => new Date(r.startedAt) > last24h));
            }
        }
        const failures24h = allRuns.filter(r => r.status === 'error').length;

        const cronStatus: CronStatus = {
            jobs: jobsWithRuns,
            activeCount,
            failures24h,
        };

        return NextResponse.json(cronStatus);
    } catch (error) {
        console.error('Error fetching cron status:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch cron status',
                jobs: [],
                activeCount: 0,
                failures24h: 0,
            },
            { status: 500 }
        );
    }
}
