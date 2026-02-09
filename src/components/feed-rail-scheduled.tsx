"use client";

import { useEffect, useState } from "react";
import { getBotColor } from "@/lib/bot-colors";

interface ScheduledTask {
  id: string;
  title: string;
  assignee: string | null;
  nextRun: string | null;
  status: string;
  type: string;
  cronExpression: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) return `${Math.abs(diffMin)}m ago`;
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `in ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `in ${diffD}d`;
}

export function FeedRailScheduled() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);

  useEffect(() => {
    fetch("/api/scheduled-tasks?status=active")
      .then((r) => r.json())
      .then((data: ScheduledTask[]) => {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const upcoming = data
          .filter((t) => t.nextRun && new Date(t.nextRun) <= in24h)
          .sort(
            (a, b) =>
              new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime()
          );
        setTasks(upcoming);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-[280px] border-l border-border-subtle flex flex-col h-full bg-[rgba(0,0,0,0.15)]">
      <div className="px-5 pt-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <span className="font-serif text-base text-moon-bone">
            Scheduled Queue
          </span>
          <span className="text-[9px] tracking-[0.2em] uppercase text-flesh-dim font-mono">
            NEXT 24H
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tasks.length === 0 && (
          <p className="text-[11px] text-moon-dim opacity-60">
            No upcoming tasks in the next 24 hours.
          </p>
        )}

        <div className="flex flex-col gap-1">
          {tasks.map((task) => (
            <div key={task.id} className="relative pl-4 py-3 group">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border-subtle" />
              <div
                className="absolute left-[-2.5px] top-[18px] w-[6px] h-[6px] rounded-full"
                style={{
                  backgroundColor: task.assignee
                    ? getBotColor(task.assignee)
                    : "var(--color-moon-dim)",
                }}
              />

              <div className="flex items-center gap-2 mb-1">
                {task.cronExpression && (
                  <span className="text-[8px] text-flesh-dim">↻</span>
                )}
                <span className="text-[10px] text-moon-dim font-mono">
                  {task.nextRun ? formatRelativeTime(task.nextRun) : "—"}
                </span>
              </div>

              <p className="text-[11px] text-moon-bone leading-relaxed">
                {task.title}
              </p>

              {task.assignee && (
                <span
                  className="text-[9px] font-mono mt-1 inline-block"
                  style={{ color: getBotColor(task.assignee) }}
                >
                  {task.assignee}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
