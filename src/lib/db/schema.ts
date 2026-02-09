import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("task_status", [
  "draft",
  "in_progress",
  "pending_review",
  "approved",
  "archived",
  "failed",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const scheduledTaskStatusEnum = pgEnum("scheduled_task_status", [
  "active",
  "paused",
  "completed",
]);

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  status: text("status").default("info"),
  source: text("source").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  objective: text("objective"),
  status: taskStatusEnum("status").default("draft").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  assignee: text("assignee"),
  tags: text("tags").array(),
  reviewCount: integer("review_count").default(0).notNull(),
  firstTrySuccess: boolean("first_try_success"),
  retroNote: text("retro_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scheduledTasks = pgTable("scheduled_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  cronExpression: text("cron_expression"),
  scheduledAt: timestamp("scheduled_at"),
  status: scheduledTaskStatusEnum("status").default("active").notNull(),
  assignee: text("assignee"),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memoryFiles = pgTable("memory_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  content: text("content"),
  path: text("path").notNull(),
  type: text("type").notNull(),
  size: integer("size").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bots = pgTable("bots", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  symbol: text("symbol").notNull(),
  role: text("role"),
  color: text("color").notNull(),
  status: text("status").default("offline").notNull(),
  currentTask: text("current_task"),
  lastSeen: timestamp("last_seen"),
  apiToken: text("api_token").notNull(),
  specialization: text("specialization"),
  memoryUsage: integer("memory_usage").default(0),
  tokenVelocity: integer("token_velocity").default(0),
  successRate: integer("success_rate").default(100),
  uptime: text("uptime").default("0d 0h"),
  model: text("model").default("gpt-4"),
  temperature: text("temperature").default("0.7"),
  memoryStrategy: text("memory_strategy").default("rolling_context"),
  basePersona: text("base_persona"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskVersions = pgTable("task_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  versionNo: integer("version_no").notNull(),
  artifactSize: text("artifact_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdByAgentId: text("created_by_agent_id"),
});

export const taskDialogueLogs = pgTable("task_dialogue_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  speakerAgentId: text("speaker_agent_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: text("agent_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskResources = pgTable("task_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  name: text("name").notNull(),
  path: text("path"),
  type: text("type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
