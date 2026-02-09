import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import {
  activities,
  tasks,
  scheduledTasks,
  memoryFiles,
  bots,
} from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding database...");

  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  // Clear existing data
  await db.delete(activities);
  await db.delete(tasks);
  await db.delete(scheduledTasks);
  await db.delete(memoryFiles);
  await db.delete(bots);

  // --- Bots ---
  const [alpha, beta, gamma] = await db
    .insert(bots)
    .values([
      {
        name: "Alpha",
        symbol: "α",
        role: "Writer",
        color: "#C4A496",
        status: "online",
        currentTask: "Draft weekly report",
        lastSeen: new Date(),
        apiToken: "tok_alpha_dev_000001",
      },
      {
        name: "Beta",
        symbol: "β",
        role: "Research",
        color: "#7D8FAD",
        status: "busy",
        currentTask: "Analyze competitor docs",
        lastSeen: new Date(),
        apiToken: "tok_beta_dev_000002",
      },
      {
        name: "Gamma",
        symbol: "γ",
        role: "Coder",
        color: "#8F9E8B",
        status: "idle",
        currentTask: null,
        lastSeen: new Date(Date.now() - 1000 * 60 * 10),
        apiToken: "tok_gamma_dev_000003",
      },
    ])
    .returning();

  console.log(`  ✓ Inserted ${3} bots`);

  // --- Tasks ---
  await db.insert(tasks).values([
    {
      title: "Draft weekly report",
      description: "Compile activity summaries from the past 7 days into a markdown report.",
      status: "in_progress",
      priority: "high",
      assignee: "Alpha",
      tags: ["report", "weekly"],
      reviewCount: 0,
      firstTrySuccess: null,
    },
    {
      title: "Analyze competitor docs",
      description: "Scrape and summarise key features from competitor documentation sites.",
      status: "in_progress",
      priority: "medium",
      assignee: "Beta",
      tags: ["research", "competitor"],
      reviewCount: 1,
      firstTrySuccess: false,
      retroNote: "First attempt missed pricing pages.",
    },
    {
      title: "Refactor auth middleware",
      description: "Move JWT verification into a shared utility and add refresh-token support.",
      status: "review",
      priority: "high",
      assignee: "Gamma",
      tags: ["code", "auth"],
      reviewCount: 2,
      firstTrySuccess: false,
      retroNote: "Edge case with expired tokens needed a second pass.",
    },
    {
      title: "Set up CI pipeline",
      description: "Configure GitHub Actions for lint, type-check, and test on every PR.",
      status: "done",
      priority: "medium",
      assignee: "Gamma",
      tags: ["devops", "ci"],
      reviewCount: 1,
      firstTrySuccess: true,
    },
    {
      title: "Write onboarding guide",
      description: "Create a step-by-step guide for new team members.",
      status: "todo",
      priority: "low",
      assignee: null,
      tags: ["docs"],
      reviewCount: 0,
    },
    {
      title: "Investigate memory leak in worker",
      description: "Profile the long-running worker process and identify the leak source.",
      status: "todo",
      priority: "urgent",
      assignee: "Beta",
      tags: ["bug", "performance"],
      reviewCount: 0,
    },
  ]);

  console.log(`  ✓ Inserted 6 tasks`);

  // --- Scheduled Tasks ---
  const now = new Date();
  await db.insert(scheduledTasks).values([
    {
      title: "Daily standup summary",
      type: "cron",
      cronExpression: "0 9 * * *",
      status: "active",
      assignee: "Alpha",
      lastRun: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      nextRun: new Date(now.getTime() + 1000 * 60 * 60 * 12),
    },
    {
      title: "Weekly metrics report",
      type: "cron",
      cronExpression: "0 18 * * 5",
      status: "active",
      assignee: "Beta",
      lastRun: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
      nextRun: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
    },
    {
      title: "One-time data migration",
      type: "one-time",
      scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 48),
      status: "active",
      assignee: "Gamma",
      lastRun: null,
      nextRun: new Date(now.getTime() + 1000 * 60 * 60 * 48),
    },
    {
      title: "Nightly backup verification",
      type: "cron",
      cronExpression: "30 3 * * *",
      status: "paused",
      assignee: null,
      lastRun: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
      nextRun: null,
    },
  ]);

  console.log(`  ✓ Inserted 4 scheduled tasks`);

  // --- Activities ---
  await db.insert(activities).values([
    {
      type: "task_update",
      description: 'Alpha started task "Draft weekly report"',
      status: "info",
      source: "Alpha",
      timestamp: new Date(now.getTime() - 1000 * 60 * 30),
    },
    {
      type: "task_update",
      description: 'Gamma moved "Refactor auth middleware" to review',
      status: "success",
      source: "Gamma",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60),
    },
    {
      type: "memory_write",
      description: "Beta updated research/competitor-analysis.md",
      status: "info",
      source: "Beta",
      timestamp: new Date(now.getTime() - 1000 * 60 * 90),
      metadata: { file: "research/competitor-analysis.md", bytes: 4820 },
    },
    {
      type: "cron",
      description: "Daily standup summary completed successfully",
      status: "success",
      source: "system",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 15),
    },
    {
      type: "system",
      description: "Worker process restarted after OOM event",
      status: "warning",
      source: "system",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 20),
      metadata: { pid: 2481, memoryMb: 512 },
    },
    {
      type: "human_action",
      description: "Admin paused nightly backup verification schedule",
      status: "info",
      source: "admin",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24),
    },
  ]);

  console.log(`  ✓ Inserted 6 activities`);

  // --- Memory Files ---
  await db.insert(memoryFiles).values([
    {
      name: "competitor-analysis.md",
      content: "# Competitor Analysis\n\n## Overview\nKey findings from Q1 research...",
      path: "research/competitor-analysis.md",
      type: "memory_node",
      size: 4820,
    },
    {
      name: "weekly-report-2026-02.md",
      content: "# Weekly Report — Feb 2026\n\n- Tasks completed: 12\n- Tasks in progress: 4",
      path: "reports/weekly-report-2026-02.md",
      type: "artifact",
      size: 1230,
    },
    {
      name: "auth-refactor-notes.md",
      content: "# Auth Refactor\n\nMoved JWT verify to shared util. Added refresh token rotation.",
      path: "notes/auth-refactor-notes.md",
      type: "memory_node",
      size: 890,
    },
    {
      name: "worker-crash-2026-02-08.log",
      content: "2026-02-08T03:12:44Z OOM killed pid 2481 (512 MB limit exceeded)",
      path: "logs/worker-crash-2026-02-08.log",
      type: "system_log",
      size: 340,
    },
  ]);

  console.log(`  ✓ Inserted 4 memory files`);

  console.log("✅ Seed complete!");
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
