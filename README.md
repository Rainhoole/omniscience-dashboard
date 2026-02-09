# Omniscience

> AI Agent 管理后台 — 统一监控和管理多个全天候运行的 AI bot。

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase)

## Features

**Manifestation** — Kanban Board
- 四列看板：Todo → In Progress → Review → Done
- 人派任务给 bot，bot 完成后提交 review，人 approve/reject
- 追踪 reviewCount 和 firstTrySuccess

**Chronology** — Calendar View
- 月视图展示 cron 定时任务和一次性任务
- 右侧 "Scheduled Queue" 显示未来 24h 任务

**Archive** — Memory File Browser
- 树形文件浏览器（memory_node / system_log / artifact）
- 内容预览：Markdown 渲染 + JSON 代码高亮

**Activity Feed** — 实时操作流
- 按 bot 颜色区分的时间线
- 10 秒自动轮询

**Global Search** — 全局搜索
- 跨 activities、tasks、memory files 搜索

**Bot Status Panel** — Agent 状态面板
- 在线/忙碌/空闲/离线状态
- Heartbeat API 上报

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 (dark theme) |
| Database | Supabase Postgres |
| ORM | Drizzle ORM |
| Auth | JWT (jose) — cookie 登录 + Bearer token |
| Deploy | Zeabur |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activities/        # Activity CRUD
│   │   ├── auth/login/        # Password login → JWT cookie
│   │   ├── bots/              # Bot registry + heartbeat
│   │   ├── memory/            # Memory file CRUD
│   │   ├── scheduled-tasks/   # Cron & one-time tasks
│   │   ├── search/            # Cross-entity search
│   │   └── tasks/             # Task CRUD + review workflow
│   ├── login/                 # Login page
│   └── page.tsx               # Dashboard (3 views)
├── components/
│   ├── header.tsx             # Top bar + search
│   ├── sidebar.tsx            # Bot status panel
│   ├── kanban-board.tsx       # Task kanban
│   ├── calendar-view.tsx      # Scheduled task calendar
│   ├── archive-view.tsx       # Memory file browser
│   ├── feed-rail.tsx          # Live activity stream
│   ├── feed-rail-scheduled.tsx
│   └── feed-rail-archive.tsx
├── lib/
│   ├── auth.ts                # JWT helpers
│   ├── bot-colors.ts          # Bot → color mapping
│   ├── activity-reporter.js   # Bot 上报插件
│   └── db/
│       ├── schema.ts          # Drizzle schema (6 tables)
│       ├── index.ts           # DB client
│       └── seed.ts            # Sample data
└── middleware.ts               # Route protection
```

## Database Schema

```
activities      — type, description, status, source, timestamp, metadata
tasks           — title, status, priority, assignee, reviewCount, firstTrySuccess, retroNote
scheduled_tasks — title, type, cronExpression, status, nextRun
memory_files    — name, content, path, type, size
bots            — name, symbol, role, color, status, currentTask, apiToken
```

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Rainhoole/omniscience-dashboard.git
cd omniscience-dashboard
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase connection string:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
API_SECRET=your-random-secret-string
ADMIN_PASSWORD=your-login-password
```

### 3. Initialize Database

```bash
npm run db:push    # Sync schema to Supabase
npm run db:seed    # Insert sample data
```

### 4. Run

```bash
npm run dev        # http://localhost:3000
```

## API Authentication

| Caller | Method | Header |
|--------|--------|--------|
| Dashboard (human) | Cookie | `omniscience_session` JWT cookie via `/api/auth/login` |
| Bot agent | Bearer token | `Authorization: Bearer <bot_api_token>` |

### Bot Activity Reporting

```js
import { report, configure } from './lib/activity-reporter';

configure({ token: 'tok_alpha_dev_000001' });

report('file_ops', 'Created user-profile.tsx', 'success', 'Alpha', {
  path: 'src/user-profile.tsx'
});
```

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate migrations |
| `npm run lint` | Run ESLint |

## Deploy (Zeabur)

1. Push repo to GitHub
2. Connect repo in [Zeabur](https://zeabur.com)
3. Add environment variables: `DATABASE_URL`, `API_SECRET`, `ADMIN_PASSWORD`
4. Zeabur auto-detects Next.js and deploys

## License

MIT
