# Mission Control Dashboard

A real-time system monitoring dashboard for OpenClaw AI agent framework. Built with Next.js 16, TypeScript, TailwindCSS, and Lucide React icons.

## Overview

Mission Control provides a centralized view of your OpenClaw system health, including:
- Gateway status and uptime
- QMD (Quantum Memory Database) index status
- Cron job monitoring with failure tracking
- Active session information
- Running agents/sub-sessions
- Recent error logs
- Dark/light theme toggle
- Password-protected access

## Authentication

The dashboard is protected by simple password authentication.

**Default Password:** `renoa1258` (set via `MISSION_CONTROL_PASSWORD` environment variable)

To change the password, set the `MISSION_CONTROL_PASSWORD` environment variable:

```bash
# In .env.local
MISSION_CONTROL_PASSWORD=your-secure-password
```

**Features:**
- Cookie-based session (7 days expiry)
- Protected API routes (all `/api/*` except `/api/auth/*`)
- Login page with password field and show/hide toggle
- Logout button in header
- Middleware protection using Next.js middleware

## Theme System

Full dark/light mode support with CSS variables and Tailwind class strategy.

**Features:**
- Toggle in header with Sun/Moon icons
- Persists to `localStorage`
- Detects system preference on first visit
- Smooth transitions (`transition: background-color 0.3s`)
- Grid background pattern in both themes
- All colors use CSS variables for instant switching

## Recent Updates

### 2026-02-16

**Authentication System:**
- Added middleware (`middleware.ts`) for route protection
- Login page (`app/login/page.tsx`) with animated UI
- Authentication API routes (`/api/auth/login`, `/api/auth/logout`, `/api/auth/check`)
- Cookie-based session management (7-day expiry)
- Logout button in header

**Theme System:**
- Dark/light mode toggle (`lib/theme.tsx`, `components/ThemeProvider.tsx`)
- CSS variables for all colors (theme-aware)
- Smooth transitions between themes
- Updated all components to use CSS variables
- Login page with gradient orbs and floating particles

**Bug Fixes:**
- Fixed middleware to allow all `/api/auth/*` routes (was too restrictive)
- Fixed gateway status parsing to handle "Runtime: running" output format
- Updated CLI parsing logic for better error handling

**Visual Improvements:**
- Enhanced login page with animated gradient orbs
- Added floating particle effects
- Theme toggle button in header
- Improved status cards with hover effects
- Better responsive design

**Deployment:**
- Cloudflare tunnel setup via quick tunnels
- URL: `https://girlfriend-kitchen-marker-rand.trycloudflare.com` (changes on each tunnel start)
- Password: `renoa1258`

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 4.x | Styling with theme variables |
| Lucide React | 0.563.x | Icons |

## Project Structure

```
mission-control/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with dark theme
│   ├── page.tsx                  # Main dashboard page (client component)
│   ├── globals.css               # Global styles, animations, scrollbar
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── api/                      # API Routes
│       ├── system-status/
│       │   └── route.ts          # GET: Gateway, QMD, sessions status
│       ├── cron-status/
│       │   └── route.ts          # GET: Cron jobs and recent runs
│       ├── recent-errors/
│       │   └── route.ts          # GET: Error logs from last 24h
│       ├── active-agents/
│       │   └── route.ts          # GET: Running sub-sessions
│       ├── action/
│       │   └── route.ts          # POST: Execute quick actions
│       └── auth/
│           ├── login/route.ts    # POST: Authenticate with password
│           ├── logout/route.ts   # POST: Clear auth session
│           └── check/route.ts    # GET: Check auth status
│
├── components/                   # React Components
│   ├── Header.tsx                # Title, subtitle, refresh, logout
│   ├── StatusCard.tsx            # Reusable status card with icon
│   ├── RunningAgents.tsx         # Active agents list panel
│   ├── CronResults.tsx           # Recent cron runs panel
│   ├── RecentErrors.tsx          # Error log panel
│   └── QuickActions.tsx          # Action buttons grid
│
├── lib/                          # Utilities
│   ├── types.ts                  # TypeScript interfaces
│   ├── cli.ts                    # CLI execution & output parsing
│   └── auth.ts                   # Authentication utilities
│
├── middleware.ts                 # Route protection middleware
├── plans/                        # Architecture documentation
│   └── mission-control-architecture.md
│
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
└── next-env.d.ts                 # Next.js type declarations
```
│
├── lib/                          # Utilities
│   ├── types.ts                  # TypeScript interfaces
│   └── cli.ts                    # CLI execution & output parsing
│
├── plans/                        # Architecture documentation
│   └── mission-control-architecture.md
│
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
└── next-env.d.ts                 # Next.js type declarations
```

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard (page.tsx)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ useEffect: fetchAllData() every 30s + manual refresh    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│     /api/system-status  /api/cron-status  /api/recent-errors   │
│     /api/active-agents  /api/action                              │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│        openclaw CLI     qmd CLI        openclaw CLI             │
│        (gateway,        (status,       (cron, logs,             │
│         sessions)        embed)         sessions)               │
└─────────────────────────────────────────────────────────────────┘
```

### API Routes

#### 1. `/api/system-status` (GET)

Fetches overall system health from multiple CLI commands in parallel.

**CLI Commands:**
- `openclaw gateway status` → Gateway status, uptime, last restart
- `qmd status` → Files indexed, vectors, last updated
- `openclaw sessions list` → Active sessions

**Response:**
```typescript
{
  gateway: {
    status: 'online' | 'offline' | 'unknown',
    uptime: string,
    lastRestart: string
  },
  memory: {
    filesIndexed: number,
    vectors: number,
    lastUpdated: string,
    stale: boolean,  // true if >24h since last update
    status: 'healthy' | 'stale' | 'error'
  },
  sessions: {
    platform: string,
    model: string,
    connected: boolean
  },
  lastUpdated: string
}
```

#### 2. `/api/cron-status` (GET)

Lists all cron jobs and their recent runs.

**CLI Commands:**
- `openclaw cron list --json` → List all jobs
- `openclaw cron runs <jobId>` → Get runs for each job

**Response:**
```typescript
{
  jobs: Array<{
    id: string,
    name: string,
    schedule: string,
    nextRun: string,
    lastRun: string,
    status: 'ok' | 'error' | 'running' | 'disabled',
    error?: string,
    enabled: boolean
  }>,
  activeCount: number,
  failures24h: number
}
```

#### 3. `/api/recent-errors` (GET)

Aggregates errors from gateway, cron, and QMD logs.

**CLI Commands:**
- `openclaw gateway logs --errors --since 24h`
- `openclaw cron logs --errors --since 24h`
- `qmd logs --errors --since 24h`

**Response:**
```typescript
{
  errors: Array<{
    timestamp: string,
    source: 'gateway' | 'cron' | 'qmd' | 'unknown',
    type: string,
    message: string
  }>
}
```

#### 4. `/api/active-agents` (GET)

Lists running isolated sessions (sub-agents).

**CLI Command:**
- `openclaw sessions list` → Filtered for isolated sessions

**Response:**
```typescript
{
  agents: Array<{
    id: string,
    label: string,
    status: 'running' | 'idle' | 'error',
    task: string,
    startedAt: string
  }>
}
```

#### 5. `/api/action` (POST)

Executes quick actions via CLI commands.

**Request:**
```typescript
{ action: 'restart-gateway' | 'run-news-scout' | 'run-twitter-pipeline' | 'reindex-qmd' | 'check-logs' }
```

**CLI Commands:**
| Action | Command |
|--------|---------|
| restart-gateway | `openclaw gateway restart` |
| run-news-scout | `openclaw cron run cron_news_scout` |
| run-twitter-pipeline | `openclaw cron run cron_twitter` |
| reindex-qmd | `qmd update && qmd embed` |
| check-logs | `openclaw logs --tail 50` |

**Response:**
```typescript
{
  success: boolean,
  result?: string,
  error?: string
}
```

### CLI Parsing Logic (`lib/cli.ts`)

All CLI output parsing follows a JSON-first approach with text fallback:

1. **Try JSON parse** - Most commands support `--json` flag
2. **Fall back to text parsing** - Regex and line-by-line extraction
3. **Handle errors gracefully** - Return default/unknown values

```typescript
// Example: Gateway status parsing
export function parseGatewayStatus(result: CLIResult): GatewayStatus {
  try {
    const json = JSON.parse(result.stdout);
    return { status: json.status, uptime: json.uptime, ... };
  } catch {
    // Text fallback
    const statusLine = result.stdout.find(l => l.includes('status'));
    return { status: statusLine?.includes('online') ? 'online' : 'offline', ... };
  }
}
```

### Components

#### Header (`components/Header.tsx`)
- Title with heart emoji
- Subtitle with user's name
- Last updated timestamp with pulse indicator
- Refresh button with loading spinner

#### StatusCard (`components/StatusCard.tsx`)
- Icon + title row
- Large value display
- Subtitle with secondary info
- Warning message (optional)
- Status indicator dot with glow

#### RunningAgents (`components/RunningAgents.tsx`)
- Panel header with count badge
- List of active agents
- Each item: label, task, started time
- Loading skeleton states

#### CronResults (`components/CronResults.tsx`)
- Panel header with job count
- Last 4 cron runs
- Status badges (ok/error)
- Error messages for failed runs

#### RecentErrors (`components/RecentErrors.tsx`)
- Panel header with 24h count
- Error list with source badges
- Color-coded by source (gateway=purple, cron=cyan, qmd=pink)
- Timestamp display

#### QuickActions (`components/QuickActions.tsx`)
- 5 action buttons in grid
- Icon + label + sublabel
- Loading spinner during execution
- Destructive styling for restart button

## Design System

### Colors

```css
/* Base */
--bg-base: #09090b          /* Deepest background */
--bg-elevated: #18181b      /* Cards, panels */
--bg-surface: #27272a       /* Hover states */

/* Text */
--text-primary: #fafafa     /* Headlines */
--text-secondary: #a1a1aa   /* Body text */
--text-muted: #71717a       /* Timestamps */

/* Status */
--status-online: #4ade80    /* Green */
--status-warning: #fbbf24   /* Amber */
--status-error: #f87171     /* Red */

/* Accent */
--accent-purple: #a78bfa    /* Primary accent */
--accent-cyan: #22d3ee      /* Secondary */
--accent-pink: #f472b6      /* Tertiary */
```

### Typography

- **Font Stack:** Inter (UI), JetBrains Mono (data)
- **Scale:** 12px (xs) → 30px (3xl)
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Animations

- **Fade in:** 300ms with 10px slide up
- **Hover lift:** -2px translateY
- **Pulse:** 2s infinite for status indicators
- **Spin:** 1s linear for loading spinners

## Running on Your Mac

### Prerequisites

1. **Node.js 18+** installed
2. **OpenClaw CLI** installed and in PATH
3. **QMD CLI** installed and in PATH

### Installation

```bash
# Navigate to project directory
cd /path/to/mission-control

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables (Optional)

Create a `.env.local` file for custom configuration:

```env
# CLI paths (if not in PATH)
OPENCLAW_PATH=/usr/local/bin/openclaw
QMD_PATH=/usr/local/bin/qmd

# Refresh interval (milliseconds)
REFRESH_INTERVAL=30000
```

### Troubleshooting

**CLI commands not found:**
```bash
# Check if openclaw is in PATH
which openclaw

# Check if qmd is in PATH
which qmd

# If not, add to PATH or use full paths in lib/cli.ts
```

**Port 3000 already in use:**
```bash
# Use a different port
PORT=3001 npm run dev
```

**TypeScript errors:**
```bash
# Rebuild type definitions
npm run build
```

## Customization

### Adding New Status Cards

1. Add type to `lib/types.ts`
2. Create API route or extend existing one
3. Add card to `app/page.tsx`:

```tsx
<StatusCard
  title="New Metric"
  value={data.value}
  subtitle="Additional info"
  status={getStatus()}
  icon="terminal"  // terminal, brain, clock, activity
/>
```

### Adding New Quick Actions

1. Add action type to `lib/types.ts`:
```typescript
export type ActionType =
  | 'restart-gateway'
  | 'run-news-scout'
  | 'your-new-action';  // Add here
```

2. Add command mapping in `app/api/action/route.ts`:
```typescript
const ACTION_COMMANDS: Record<ActionType, string> = {
  // ...existing
  'your-new-action': 'openclaw your-command',
};
```

3. Add button in `components/QuickActions.tsx`:
```typescript
const actions: ActionButton[] = [
  // ...existing
  {
    id: 'your-new-action',
    label: 'Action',
    sublabel: 'Name',
    icon: YourIcon,
  },
];
```

### Modifying Refresh Interval

In `app/page.tsx`, change the interval:

```typescript
// Change from 30000 (30s) to your preferred value
const interval = setInterval(fetchAllData, 60000); // 60s
```

## License

MIT

## Author

Built for Renoa's OpenClaw command center.
