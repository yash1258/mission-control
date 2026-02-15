# Mission Control Dashboard - Architecture Plan

## Overview

A Next.js dashboard for monitoring OpenClaw AI agent framework. Dark mode, functional, dev-tool aesthetic.

## Tech Stack

- **Next.js 16+** with App Router
- **TypeScript** for type safety
- **TailwindCSS 4** for styling
- **Lucide React** for icons
- **Client components** for interactivity

## Project Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with dark theme
│   │   ├── page.tsx            # Main dashboard page
│   │   ├── globals.css         # Global styles
│   │   └── api/
│   │       ├── system-status/
│   │       │   └── route.ts    # Gateway, QMD, sessions status
│   │       ├── cron-status/
│   │       │   └── route.ts    # Cron jobs and recent runs
│   │       ├── recent-errors/
│   │       │   └── route.ts    # Error logs from last 24h
│   │       ├── active-agents/
│   │       │   └── route.ts    # Running sub-sessions
│   │       └── action/
│   │           └── route.ts    # Quick actions handler
│   ├── components/
│   │   ├── Header.tsx          # Title, subtitle, refresh button
│   │   ├── StatusCard.tsx      # Reusable status card
│   │   ├── RunningAgents.tsx   # Active agents panel
│   │   ├── CronResults.tsx     # Recent cron runs panel
│   │   ├── RecentErrors.tsx    # Error log panel
│   │   └── QuickActions.tsx    # Action buttons grid
│   ├── lib/
│   │   ├── cli.ts              # CLI command execution utilities
│   │   └── types.ts            # TypeScript interfaces
│   └── hooks/
│       └── useAutoRefresh.ts   # 30s polling hook
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## API Routes Design

### 1. `/api/system-status` (GET)

**CLI Commands:**
- `openclaw gateway status` - Gateway status
- `qmd status` - QMD memory status  
- `openclaw sessions list` - Active sessions

**Response:**
```typescript
interface SystemStatus {
  gateway: {
    status: 'online' | 'offline'
    uptime: string
    lastRestart: string
  }
  memory: {
    filesIndexed: number
    vectors: number
    lastUpdated: string
    stale: boolean // warn if >24h
  }
  sessions: {
    platform: string
    model: string
    connected: boolean
  }
  lastUpdated: string
}
```

### 2. `/api/cron-status` (GET)

**CLI Commands:**
- `openclaw cron list --json` - List all cron jobs
- `openclaw cron runs <jobId>` - Get runs for each job

**Response:**
```typescript
interface CronStatus {
  jobs: Array<{
    id: string
    name: string
    schedule: string
    nextRun: string
    lastRun: string
    status: 'ok' | 'error' | 'running'
    error?: string
  }>
  activeCount: number
  failures24h: number
}
```

### 3. `/api/recent-errors` (GET)

**Sources:** Gateway logs, cron errors, QMD failures

**Response:**
```typescript
interface RecentErrors {
  errors: Array<{
    timestamp: string
    source: 'gateway' | 'cron' | 'qmd'
    type: string
    message: string
  }>
}
```

### 4. `/api/active-agents` (GET)

**CLI Command:**
- `openclaw sessions list` - Filter for isolated sessions

**Response:**
```typescript
interface ActiveAgents {
  agents: Array<{
    id: string
    label: string
    status: 'running' | 'idle' | 'error'
    task: string
    startedAt: string
  }>
}
```

### 5. `/api/action` (POST)

**Actions:**
| Action | CLI Command |
|--------|-------------|
| restart-gateway | `openclaw gateway restart` |
| run-news-scout | `openclaw cron run <news-scout-job-id>` |
| run-twitter-pipeline | `openclaw cron run <twitter-job-id>` |
| reindex-qmd | `qmd update && qmd embed` |
| check-logs | Return recent log entries |

**Request:**
```typescript
{ action: string }
```

**Response:**
```typescript
{ success: boolean; result?: string; error?: string }
```

## Component Architecture

### Layout Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Title + Subtitle + Refresh Button                   │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ Gateway     │ QMD Memory  │ Cron Jobs   │ Active Session  │
│ Status Card │ Status Card │ Status Card │ Status Card     │
├─────────────┴─────────────┴─────────────┴─────────────────┤
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ Running      │ │ Recent Cron  │ │ Recent Errors    │   │
│  │ Agents       │ │ Results      │ │                  │   │
│  │              │ │              │ │                  │   │
│  │              │ │              │ │                  │   │
│  └──────────────┘ └──────────────┘ └──────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Quick Actions: [Restart] [News Scout] [Twitter] [Reindex]   │
├─────────────────────────────────────────────────────────────┤
```

### Status Indicators

| Color | Status |
|-------|--------|
| Green | Everything working |
| Yellow | Warning - QMD stale, minor issues |
| Red | Critical - Gateway down, repeated failures |

### Icons (Lucide)

| Component | Icon |
|-----------|------|
| Gateway | `Terminal` |
| Memory | `Brain` |
| Cron | `Clock` |
| Session | `Activity` |
| Agents | `Zap` |
| Errors | `AlertCircle` |
| Refresh | `RefreshCw` |

## UI/UX Design Specifications

### Design Philosophy

**Core Principle:** "Dev tool, not marketing page" — functional, sharp, with personality.

**Visual Identity:**
- Terminal-inspired aesthetic with modern polish
- Subtle depth through shadows and borders, not gradients
- Purposeful color accents, not rainbow dashboards
- Information density that respects the user's time

### Color System

```css
/* Base Palette - Dark Mode */
--bg-base: #09090b           /* Deepest background */
--bg-elevated: #18181b       /* Cards, panels */
--bg-surface: #27272a        /* Inputs, hover states */
--bg-muted: #3f3f46          /* Disabled, subtle highlights */

/* Text Hierarchy */
--text-primary: #fafafa      /* Headlines, important values */
--text-secondary: #a1a1aa    /* Body text, descriptions */
--text-muted: #71717a        /* Timestamps, labels */
--text-accent: #a78bfa       /* Links, highlights */

/* Status Colors - Vibrant but not neon */
--status-online: #4ade80     /* Green - healthy */
--status-warning: #fbbf24    /* Amber - attention needed */
--status-error: #f87171      /* Red - critical */
--status-info: #60a5fa       /* Blue - informational */

/* Accent Colors - Used sparingly */
--accent-purple: #a78bfa     /* Primary accent */
--accent-cyan: #22d3ee       /* Secondary accent */
--accent-pink: #f472b6       /* Tertiary accent */

/* Borders & Dividers */
--border-subtle: #27272a     /* Barely visible */
--border-default: #3f3f46    /* Default state */
--border-emphasis: #52525b   /* Focus, active */

/* Shadows - Subtle depth */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.4)
--shadow-md: 0 4px 6px rgba(0,0,0,0.4)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.5)
--shadow-glow: 0 0 20px rgba(167,139,250,0.15)  /* Purple glow for emphasis */
```

### Typography System

```css
/* Font Stack */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
--font-sans: 'Inter', -apple-system, 'Segoe UI', sans-serif;

/* Type Scale */
--text-xs: 0.75rem;      /* 12px - Timestamps, badges */
--text-sm: 0.875rem;     /* 14px - Body text, labels */
--text-base: 1rem;       /* 16px - Default */
--text-lg: 1.125rem;     /* 18px - Card titles */
--text-xl: 1.25rem;      /* 20px - Section headers */
--text-2xl: 1.5rem;      /* 24px - Page title */
--text-3xl: 1.875rem;    /* 30px - Large values */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System

```css
/* 4px base unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### Animation & Motion

```css
/* Timing Functions */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Smooth deceleration */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* Smooth both ways */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Slight overshoot */

/* Durations */
--duration-fast: 150ms;     /* Hover states, toggles */
--duration-normal: 250ms;   /* Card interactions */
--duration-slow: 400ms;     /* Page transitions, modals */

/* Common Transitions */
--transition-colors: color, background-color, border-color, fill, stroke;
--transition-transform: transform;
--transition-opacity: opacity;
```

### Component-Specific Designs

#### Header Component

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🖤 Mission Control                        ↻ Refresh            │
│     Renoa's command center                  Last updated 2m ago │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Title: `text-2xl font-bold text-primary` with subtle purple glow on emoji
- Subtitle: `text-sm text-muted font-mono`
- Refresh button: Icon-only with hover rotation animation
- Last updated: `text-xs text-muted` with pulse dot indicator

**Interactions:**
- Refresh button: 360° rotation on click, disabled state during loading
- Hover: Subtle background highlight on refresh button
- Loading: Spinning icon animation

#### Status Cards

```
┌─────────────────────────┐
│ ◈ GATEWAY               │  ← Icon + Label (muted, uppercase, tracking-wide)
│                         │
│ Online                  │  ← Status value (large, colored by status)
│ Uptime: 5d 12h          │  ← Secondary info (smaller, muted)
│                         │
│ ●                       │  ← Status indicator dot (bottom-right corner)
└─────────────────────────┘
```

**Card Styling:**
```css
.status-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: var(--space-5);
  position: relative;
  overflow: hidden;
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.status-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-md);
}

/* Status indicator positioning */
.status-indicator {
  position: absolute;
  bottom: var(--space-4);
  right: var(--space-4);
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.online {
  background: var(--status-online);
  box-shadow: 0 0 8px var(--status-online);
}

.status-indicator.warning {
  background: var(--status-warning);
  box-shadow: 0 0 8px var(--status-warning);
  animation: pulse 2s infinite;
}

.status-indicator.error {
  background: var(--status-error);
  box-shadow: 0 0 8px var(--status-error);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Icon Styling:**
- Size: 20px
- Color: Matches status color or accent-purple for neutral
- Subtle animation on status change

#### Panel Components (Running Agents, Cron Results, Errors)

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ RUNNING AGENTS                                    3 active   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  News Scout Agent                                              │
│  Scanning RSS feeds...                          ● running       │
│  Started 2m ago                                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Twitter Monitor                                               │
│  Processing mentions                            ● running       │
│  Started 15m ago                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Panel Styling:**
```css
.panel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  background: linear-gradient(to bottom, var(--bg-surface), transparent);
}

.panel-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.panel-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: var(--space-1) var(--space-2);
  border-radius: 9999px;
  background: var(--bg-surface);
  color: var(--text-muted);
}

.panel-content {
  padding: var(--space-4);
  max-height: 300px;
  overflow-y: auto;
}

/* Custom scrollbar */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-emphasis);
}
```

**List Item Styling:**
```css
.list-item {
  padding: var(--space-3) var(--space-4);
  border-radius: 8px;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.list-item:hover {
  background: var(--bg-surface);
}

.list-item + .list-item {
  margin-top: var(--space-2);
}

.item-title {
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.item-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.item-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-top: var(--space-1);
}
```

#### Quick Actions Grid

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│                │ │                │ │                │ │                │ │                │
│  ⟳ Restart     │ │  📰 News       │ │  🐦 Twitter    │ │  🧠 Reindex    │ │  📋 Logs       │
│  Gateway       │ │  Scout         │ │  Pipeline      │ │  QMD           │ │                │
│                │ │                │ │                │ │                │ │                │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

**Button Styling:**
```css
.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.action-button:hover {
  background: var(--bg-surface);
  border-color: var(--border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-button:active {
  transform: translateY(0);
}

.action-button.loading {
  pointer-events: none;
  opacity: 0.7;
}

.action-button .icon {
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
  transition: color var(--duration-fast) var(--ease-out);
}

.action-button:hover .icon {
  color: var(--accent-purple);
}

.action-button .label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.action-button:hover .label {
  color: var(--text-primary);
}

/* Destructive action styling */
.action-button.destructive:hover {
  border-color: var(--status-error);
}

.action-button.destructive:hover .icon {
  color: var(--status-error);
}
```

### Micro-interactions

#### Status Change Animation
```css
@keyframes statusChange {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.status-indicator.changing {
  animation: statusChange 0.3s var(--ease-spring);
}
```

#### Loading Skeleton
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface) 25%,
    var(--bg-muted) 50%,
    var(--bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Refresh Animation
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-button.loading .icon {
  animation: spin 1s linear infinite;
}
```

#### Fade In Animation
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s var(--ease-out) forwards;
}

/* Staggered children */
.fade-in-stagger > * {
  opacity: 0;
  animation: fadeIn 0.3s var(--ease-out) forwards;
}

.fade-in-stagger > *:nth-child(1) { animation-delay: 0ms; }
.fade-in-stagger > *:nth-child(2) { animation-delay: 50ms; }
.fade-in-stagger > *:nth-child(3) { animation-delay: 100ms; }
.fade-in-stagger > *:nth-child(4) { animation-delay: 150ms; }
```

### Responsive Considerations

```css
/* Mobile-first approach */
.dashboard-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns for status cards */
@media (min-width: 640px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns for status cards, 3 for panels */
@media (min-width: 1024px) {
  .status-cards {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .panels-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### Visual Hierarchy

1. **Primary Focus:** Status values and indicators (largest, brightest)
2. **Secondary:** Labels, descriptions (medium, muted)
3. **Tertiary:** Timestamps, meta info (smallest, most muted)

### What to Avoid

- ❌ Generic gradients (especially purple-blue)
- ❌ Over-rounded corners (max 12px)
- ❌ Excessive shadows (keep subtle)
- ❌ Rainbow status colors (stick to green/yellow/red)
- ❌ Stock icon colors (customize to match palette)
- ❌ Template-like equal spacing (vary intentionally)
- ❌ SaaS landing page vibes (this is a tool, not a product)

### What Works

- ✅ Subtle depth through layered backgrounds
- ✅ Purposeful color accents (purple for interactive elements)
- ✅ Clean monospace for data values
- ✅ Intentional whitespace
- ✅ Smooth but quick animations
- ✅ Clear visual hierarchy
- ✅ Consistent but not formulaic spacing
- ✅ Terminal-inspired aesthetic with modern polish

## Auto-Refresh Strategy

1. Poll `/api/system-status` every 30 seconds
2. Manual refresh button triggers immediate fetch
3. Show last updated timestamp
4. Loading states during fetches

## CLI Command Parsing Logic

### Utility Module: `lib/cli.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CLI_TIMEOUT = 30000; // 30 seconds
const CLI_ENCODING = 'utf-8';

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface CLIError {
  command: string;
  message: string;
  stderr: string;
  exitCode: number;
}

// Execute a CLI command with timeout
async function executeCommand(command: string, timeout = CLI_TIMEOUT): Promise<CLIResult> {
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
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message,
      exitCode: error.code || 1,
    };
  }
}
```

### Command Parsing Details

#### 1. Gateway Status

**Command:** `openclaw gateway status`

**Expected Output Formats:**

```bash
# Format 1: JSON output (preferred)
{
  "status": "online",
  "uptime": "5d 12h 34m",
  "lastRestart": "2024-01-10T08:30:00Z",
  "version": "1.2.3"
}

# Format 2: Plain text
Gateway Status: online
Uptime: 5d 12h 34m
Last Restart: 2024-01-10 08:30:00

# Format 3: Offline state
Gateway Status: offline
Error: Connection refused
```

**Parsing Logic:**

```typescript
interface GatewayStatus {
  status: 'online' | 'offline' | 'unknown';
  uptime: string;
  lastRestart: string;
  version?: string;
  error?: string;
}

async function parseGatewayStatus(result: CLIResult): Promise<GatewayStatus> {
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

// Helper to extract value from "Key: Value" format
function extractValue(line?: string): string | null {
  if (!line) return null;
  const parts = line.split(':');
  return parts.length > 1 ? parts.slice(1).join(':').trim() : null;
}
```

#### 2. QMD Status

**Command:** `qmd status`

**Expected Output Formats:**

```bash
# Format 1: JSON output
{
  "filesIndexed": 1523,
  "vectors": 45000,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "indexSize": "256MB",
  "status": "healthy"
}

# Format 2: Plain text
QMD Memory Status
Files Indexed: 1523
Vectors: 45000
Last Updated: 2024-01-15 10:30:00
Status: healthy

# Format 3: Error state
QMD Status: error
Error: Index corrupted, rebuild required
```

**Parsing Logic:**

```typescript
interface QMDStatus {
  filesIndexed: number;
  vectors: number;
  lastUpdated: string;
  stale: boolean; // true if >24h since last update
  status: 'healthy' | 'stale' | 'error';
  error?: string;
}

async function parseQMDStatus(result: CLIResult): Promise<QMDStatus> {
  const now = new Date();
  const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours in ms
  
  try {
    const json = JSON.parse(result.stdout);
    const lastUpdated = new Date(json.lastUpdated);
    const stale = (now.getTime() - lastUpdated.getTime()) > staleThreshold;
    
    return {
      filesIndexed: json.filesIndexed || 0,
      vectors: json.vectors || 0,
      lastUpdated: json.lastUpdated,
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
```

#### 3. Sessions List

**Command:** `openclaw sessions list`

**Expected Output Formats:**

```bash
# Format 1: JSON output
{
  "sessions": [
    {
      "id": "sess_abc123",
      "platform": "telegram",
      "model": "gpt-4",
      "status": "active",
      "connected": true,
      "startedAt": "2024-01-15T08:00:00Z",
      "isolated": false
    },
    {
      "id": "sess_def456",
      "label": "News Scout Agent",
      "platform": "internal",
      "model": "gpt-3.5-turbo",
      "status": "running",
      "task": "Scanning news sources",
      "startedAt": "2024-01-15T10:30:00Z",
      "isolated": true
    }
  ]
}

# Format 2: Table format
ID            Platform   Model        Status    Isolated
sess_abc123   telegram   gpt-4        active    no
sess_def456   internal   gpt-3.5      running   yes

# Format 3: Empty state
No active sessions
```

**Parsing Logic:**

```typescript
interface Session {
  id: string;
  label?: string;
  platform: string;
  model: string;
  status: 'active' | 'running' | 'idle' | 'error';
  task?: string;
  startedAt: string;
  isolated: boolean;
  connected: boolean;
}

async function parseSessionsList(result: CLIResult): Promise<Session[]> {
  // Empty state check
  if (result.stdout.toLowerCase().includes('no active sessions') || 
      result.stdout.trim() === '') {
    return [];
  }
  
  try {
    const json = JSON.parse(result.stdout);
    return (json.sessions || []).map((s: any) => ({
      id: s.id,
      label: s.label,
      platform: s.platform,
      model: s.model,
      status: s.status,
      task: s.task,
      startedAt: s.startedAt,
      isolated: s.isolated || false,
      connected: s.connected ?? true,
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
        status: cols[3] || 'unknown',
        isolated: cols[4] === 'yes',
        startedAt: new Date().toISOString(),
        connected: true,
      };
    });
  }
}
```

#### 4. Cron List

**Command:** `openclaw cron list --json`

**Expected Output Formats:**

```bash
# JSON format (with --json flag)
{
  "jobs": [
    {
      "id": "cron_news_scout",
      "name": "News Scout",
      "schedule": "0 */6 * * *",
      "nextRun": "2024-01-15T12:00:00Z",
      "lastRun": "2024-01-15T06:00:00Z",
      "status": "ok",
      "enabled": true
    },
    {
      "id": "cron_twitter",
      "name": "Twitter Pipeline",
      "schedule": "0 9 * * *",
      "nextRun": "2024-01-16T09:00:00Z",
      "lastRun": "2024-01-15T09:00:00Z",
      "status": "error",
      "error": "Rate limit exceeded",
      "enabled": true
    }
  ]
}
```

**Parsing Logic:**

```typescript
interface CronJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  status: 'ok' | 'error' | 'running' | 'disabled';
  error?: string;
  enabled: boolean;
}

async function parseCronList(result: CLIResult): Promise<CronJob[]> {
  try {
    const json = JSON.parse(result.stdout);
    return (json.jobs || []).map((job: any) => ({
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      nextRun: job.nextRun || 'N/A',
      lastRun: job.lastRun || 'Never',
      status: job.enabled ? (job.status || 'ok') : 'disabled',
      error: job.error,
      enabled: job.enabled ?? true,
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
```

#### 5. Cron Runs

**Command:** `openclaw cron runs <jobId>`

**Expected Output Formats:**

```bash
# JSON format
{
  "runs": [
    {
      "id": "run_001",
      "jobId": "cron_news_scout",
      "startedAt": "2024-01-15T06:00:00Z",
      "completedAt": "2024-01-15T06:05:23Z",
      "duration": "5m 23s",
      "status": "ok",
      "itemsProcessed": 42
    },
    {
      "id": "run_002",
      "jobId": "cron_news_scout",
      "startedAt": "2024-01-14T18:00:00Z",
      "completedAt": "2024-01-14T18:02:15Z",
      "duration": "2m 15s",
      "status": "error",
      "error": "Connection timeout"
    }
  ]
}
```

**Parsing Logic:**

```typescript
interface CronRun {
  id: string;
  jobId: string;
  startedAt: string;
  completedAt?: string;
  duration?: string;
  status: 'ok' | 'error' | 'running';
  error?: string;
  itemsProcessed?: number;
}

async function parseCronRuns(result: CLIResult): Promise<CronRun[]> {
  try {
    const json = JSON.parse(result.stdout);
    return (json.runs || []).map((run: any) => ({
      id: run.id,
      jobId: run.jobId,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      duration: run.duration,
      status: run.status,
      error: run.error,
      itemsProcessed: run.itemsProcessed,
    }));
  } catch {
    return [];
  }
}
```

#### 6. Recent Errors

**Command:** `openclaw logs --errors --since 24h` (or similar)

**Expected Output Formats:**

```bash
# JSON format
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "source": "gateway",
      "level": "error",
      "type": "ConnectionError",
      "message": "Failed to connect to OpenAI API: timeout"
    },
    {
      "timestamp": "2024-01-15T09:15:00Z",
      "source": "cron",
      "level": "error",
      "type": "RateLimitError",
      "message": "Twitter API rate limit exceeded"
    }
  ]
}
```

**Alternative Sources:**
- Gateway logs: `openclaw gateway logs --errors --since 24h`
- Cron errors: `openclaw cron logs --errors --since 24h`
- QMD errors: `qmd logs --errors --since 24h`

**Parsing Logic:**

```typescript
interface ErrorLog {
  timestamp: string;
  source: 'gateway' | 'cron' | 'qmd' | 'unknown';
  type: string;
  message: string;
}

async function parseErrorLogs(result: CLIResult, source: string): Promise<ErrorLog[]> {
  try {
    const json = JSON.parse(result.stdout);
    return (json.logs || json.errors || []).map((log: any) => ({
      timestamp: log.timestamp || log.time || new Date().toISOString(),
      source: log.source || source,
      type: log.type || log.level || 'UnknownError',
      message: log.message || log.msg || 'Unknown error',
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
        source: source as any,
        type: 'Error',
        message: line.trim(),
      };
    });
  }
}
```

#### 7. Action Commands

**Commands and Expected Outputs:**

| Action | Command | Success Indicator |
|--------|---------|-------------------|
| restart-gateway | `openclaw gateway restart` | "Gateway restarted successfully" or exit code 0 |
| run-news-scout | `openclaw cron run cron_news_scout` | "Job triggered" or job ID returned |
| run-twitter-pipeline | `openclaw cron run cron_twitter` | "Job triggered" or job ID returned |
| reindex-qmd | `qmd update && qmd embed` | "Index updated" or file count |
| check-logs | `openclaw logs --tail 50` | Log entries returned |

**Parsing Logic:**

```typescript
interface ActionResult {
  success: boolean;
  result?: string;
  error?: string;
}

function parseActionResult(result: CLIResult, action: string): ActionResult {
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
```

### Error Handling Strategy

```typescript
// lib/cli.ts - Error handling wrapper

class CLIExecutionError extends Error {
  constructor(
    public command: string,
    public exitCode: number,
    public stderr: string,
    public stdout: string
  ) {
    super(`Command failed: ${command}`);
    this.name = 'CLIExecutionError';
  }
}

// Timeout wrapper
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  command: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Command timed out: ${command}`)), timeoutMs)
    ),
  ]);
}

// Retry logic for transient failures
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
}
```

## Implementation Order

1. Project setup (Next.js, TypeScript, TailwindCSS, Lucide)
2. CLI execution utility (`lib/cli.ts`)
3. Type definitions (`lib/types.ts`)
4. API routes (one by one)
5. Components (Header → Cards → Panels → Actions)
6. Main page assembly
7. Auto-refresh hook
8. Styling refinement
