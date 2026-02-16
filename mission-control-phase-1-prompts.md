# Mission Control - Phase 1 Prompts

## Overview
Integrate Mission Control with OpenClaw Gateway via WebSocket. Make existing static cards dynamic with real-time data.

---

## Feature 1: WebSocket Gateway Client

### Goal
Create a WebSocket client that connects to OpenClaw Gateway and handles authentication + RPC calls.

### Requirements
- Connect to `ws://127.0.0.1:18789`
- Implement JSON-RPC 2.0 protocol: `{type:"req", id, method, params}`
- Handle auth via gateway token from `OPENCLAW_GATEWAY_TOKEN` env var
- Send initial `connect` handshake
- Handle responses: `{type:"res", id, ok, payload|error}`
- Handle events: `{type:"event", event, payload}`
- Auto-reconnect on disconnect
- Error handling with user feedback

### File Structure
```
lib/openclaw-ws-client.ts          # Main WebSocket client
lib/openclaw-rpc.ts               # RPC call wrapper
lib/openclaw-types.ts              # TypeScript types for gateway messages
hooks/useOpenClawGateway.ts        # React hook for components
```

### OpenClaw Connection
```typescript
// lib/openclaw-ws-client.ts
export class OpenClawGatewayClient {
  private ws: WebSocket | null = null;
  private requestMap = new Map<number, any>();
  private messageId = 0;

  constructor(private token: string) {}

  connect(url: string = 'ws://127.0.0.1:18789') {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // Send connect handshake
      this.send({
        type: 'req',
        id: ++this.messageId,
        method: 'connect',
        params: {
          role: 'operator',
          scopes: ['operator.read', 'operator.write'],
          auth: { token: this.token },
          client: {
            id: 'mission-control',
            version: '1.0.0',
            platform: 'web',
            mode: 'operator'
          }
        }
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'res') {
        const callback = this.requestMap.get(message.id);
        if (callback) {
          if (message.ok) {
            callback(null, message.payload);
          } else {
            callback(message.error, null);
          }
          this.requestMap.delete(message.id);
        }
      } else if (message.type === 'event') {
        this.emit(message.event, message.payload);
      }
    };
  }

  call(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.requestMap.set(id, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });

      this.ws?.send(JSON.stringify({
        type: 'req',
        id,
        method,
        params: params || {}
      }));
    });
  });
  }
}
```

### Success Criteria
- [ ] WebSocket connects successfully to gateway
- [ ] Auth handshake completes without errors
- [ ] `call()` method sends requests and receives responses
- [ ] Auto-reconnects on disconnect (with exponential backoff)
- [ ] React hook exposes client to components

---

## Feature 2: Dynamic Gateway Status

### Goal
Convert static Gateway Status card to fetch real data from OpenClaw Gateway via RPC `health` method.

### Requirements
- Call `health` RPC method on mount and every 30 seconds
- Display: runtime status (running/stopped), PID, bind mode, listening port
- Show channel status (Telegram, Discord) with last probe time
- Show agent count + default agent
- Show heartbeat interval
- Error states should be clearly marked (red badge, error message)
- Loading state while fetching

### File Changes
```
components/GatewayStatus.tsx           # Update to use hook
components/StatusCard.tsx              # New reusable status component
```

### Implementation
```typescript
// components/GatewayStatus.tsx
import { useOpenClawGateway } from '@/hooks/useOpenClawGateway';

export default function GatewayStatus() {
  const gateway = useOpenClawGateway();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gateway?.connected) return;

    const fetchHealth = async () => {
      try {
        const result = await gateway.call('health');
        setHealth(result);
        setLoading(false);
      } catch (err) {
        console.error('Health check failed:', err);
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, [gateway?.connected]);

  if (loading) return <LoadingSpinner />;
  if (!health) return <ErrorMessage />;

  return (
    <StatusCard
      title="Gateway Status"
      status={health.ok ? 'online' : 'offline'}
      details={{
        'Runtime': health.runtime?.state,
        'PID': health.runtime?.pid,
        'Bind Mode': health.runtime?.bindMode,
        'Listening': health.runtime?.listening,
        'Channels': Object.entries(health.channels || {})
          .map(([name, ch]) => `${name}: ${ch.running ? '✅' : '❌'}`)
          .join(', '),
        'Heartbeat': `${health.heartbeatSeconds}s`,
        'Agents': health.agents?.length || 0
      }}
    />
  );
}
```

### Success Criteria
- [ ] Gateway status fetches real data from OpenClaw
- [ ] Auto-refreshes every 30 seconds
- [ ] Shows all health fields (runtime, channels, agents)
- [ ] Error states handled gracefully
- [ ] Loading state displayed during fetch

---

## Feature 3: Active Sessions List

### Goal
Display list of active OpenClaw sessions via RPC `sessions.list` method.

### Requirements
- Call `sessions.list` RPC method on mount
- Display: session key, kind (direct/group), origin (channel/provider), updatedAt timestamp, duration
- Filter/sort by: active only, recent first
- Show provider icons (Telegram, Discord, etc.)
- Click to view session details (expandable or modal)
- Show agent session separately highlighted
- Loading + empty states

### File Changes
```
components/SessionsList.tsx            # New component
components/SessionCard.tsx             # Individual session card
```

### Implementation
```typescript
// components/SessionsList.tsx
import { useOpenClawGateway } from '@/hooks/useOpenClawGateway';
import { formatDistanceToNow } from 'date-fns';

export default function SessionsList() {
  const gateway = useOpenClawGateway();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gateway?.connected) return;

    gateway.call('sessions.list', { limit: 20 })
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gateway?.connected]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
      {loading ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <EmptyState message="No active sessions" />
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              timeAgo={formatDistanceToNow(new Date(session.updatedAt))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Success Criteria
- [ ] Sessions fetch from OpenClaw via RPC
- [ ] List shows all active sessions
- [ ] Displays session metadata (kind, origin, time)
- [ ] Empty state shown when no sessions
- [ ] Loading state during fetch

---

## Feature 4: Cron Jobs List

### Goal
Display list of scheduled cron jobs via RPC `cron.list` method.

### Requirements
- Call `cron.list` RPC method on mount
- Display: job name, schedule (human-readable), next run time, last run status, enabled/disabled
- Show job type (systemEvent/agentTurn)
- Allow quick actions: enable/disable, run now, view logs
- Show agent target for job
- Badge for "running" jobs

### File Changes
```
components/CronJobsList.tsx            # New component
components/CronJobCard.tsx             # Individual job card
```

### Implementation
```typescript
// components/CronJobsList.tsx
import { useOpenClawGateway } from '@/hooks/useOpenClawGateway';

export default function CronJobsList() {
  const gateway = useOpenClawGateway();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gateway?.connected) return;

    gateway.call('cron.list')
      .then((data) => setJobs(data.jobs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gateway?.connected]);

  const formatSchedule = (schedule) => {
    if (schedule.kind === 'cron') {
      return `Cron: ${schedule.expr}`;
    } else if (schedule.kind === 'every') {
      return `Every ${schedule.everyMs / 60000}min`;
    } else {
      return `At: ${new Date(schedule.at).toLocaleString()}`;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Cron Jobs</h2>
      {loading ? (
        <LoadingSpinner />
      ) : jobs.length === 0 ? (
        <EmptyState message="No scheduled jobs" />
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <CronJobCard
              key={job.id}
              job={job}
              schedule={formatSchedule(job.schedule)}
              onToggle={(enabled) => gateway.call('cron.update', { id: job.id, patch: { enabled } })}
              onRun={() => gateway.call('cron.run', { id: job.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Success Criteria
- [ ] Cron jobs fetch from OpenClaw via RPC
- [ ] List shows all jobs with schedule info
- [ ] Enable/disable toggle works
- [ ] "Run now" triggers job execution
- [ ] Empty/loading states handled

---

## Phase 1 Summary

### Before Starting
- Set `OPENCLAW_GATEWAY_TOKEN` in `.env.local`
- Ensure OpenClaw gateway is running (`openclaw gateway status`)
- Test WebSocket connection manually: `ws://127.0.0.1:18789`

### Testing Checklist
- [ ] WebSocket connects with auth handshake
- [ ] Gateway status shows real data
- [ ] Sessions list populates
- [ ] Cron jobs list populates
- [ ] Auto-refresh works (30s interval)
- [ ] Error states display correctly
- [ ] Dark/light mode works with all new components

### Success Definition
Phase 1 complete when:
- All 4 features implemented and tested
- Data is real-time from OpenClaw (not hardcoded)
- Error handling is robust
- Code is committed to repo

---

## Notes for Coding Agent
- Use existing project structure (Next.js 15, TypeScript, Tailwind CSS)
- Match current code style (components in `components/`, hooks in `hooks/`)
- Reuse existing UI patterns (StatusCard, LoadingSpinner, etc.)
- Write TypeScript types for all OpenClaw responses
- Add console.log for debugging WebSocket messages
