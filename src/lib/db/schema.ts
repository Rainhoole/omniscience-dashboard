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
  "todo",
  "in_progress",
  "review",
  "done",
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
  status: taskStatusEnum("status").default("todo").notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
