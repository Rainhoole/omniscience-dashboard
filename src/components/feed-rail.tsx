"use client";

import { useEffect, useState } from "react";
import { getBotColor } from "@/lib/bot-colors";

interface ActivityMetadata {
  runId?: string;
  taskId?: string;
  agentId?: string;
  [key: string]: unknown;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  status: string | null;
  source: string;
  timestamp: string;
  metadata: ActivityMetadata | null;
}

interface RunTraceResponse {
  runId: string;
  activities: Activity[];
  timelineEvents: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    occurredAt: string;
    metadata: ActivityMetadata | null;
  }>;
}

interface TaskDetail {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  priority: string;
  updatedAt: string;
}

function formatTime(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return (
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
}

export function FeedRail() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runTrace, setRunTrace] = useState<RunTraceResponse | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);

  useEffect(() => {
    const fetchActivities = () => {
      const qs = selectedRunId
        ? `/api/activities?limit=30&runId=${encodeURIComponent(selectedRunId)}`
        : "/api/activities?limit=30";
      fetch(qs)
        .then((r) => r.json())
        .then(setActivities)
        .catch(() => {});
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) {
      setRunTrace(null);
      return;
    }

    setTraceLoading(true);
    fetch(`/api/openclaw/runs/${encodeURIComponent(selectedRunId)}`)
      .then((r) => r.json())
      .then((data) => setRunTrace(data))
      .catch(() => setRunTrace(null))
      .finally(() => setTraceLoading(false));
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedTaskId) {
      setTaskDetail(null);
      return;
    }

    fetch(`/api/tasks/${encodeURIComponent(selectedTaskId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTaskDetail(data))
      .catch(() => setTaskDetail(null));
  }, [selectedTaskId]);

  return (
    <aside
      className="border-l border-border-subtle flex flex-col"
      style={{ background: "rgba(5,5,5,0.5)" }}
    >
      <div className="px-6 py-5 border-b border-border-subtle flex justify-between items-center text-moon-bone font-serif text-base">
        <span>The Stream</span>
        <span className="text-[10px] font-mono opacity-50">LIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div
          className="absolute top-0 left-7 w-px h-full z-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
          }}
        />

        {activities.map((item) => {
          const color = getBotColor(item.source);
          const runId = item.metadata?.runId;
          const taskId = item.metadata?.taskId;

          return (
            <div
              key={item.id}
              className="relative flex gap-4 p-4 text-[11px] leading-relaxed"
            >
              <div
                className="w-[9px] h-[9px] rounded-full bg-void border shrink-0 z-10 mt-1"
                style={{
                  borderColor: color,
                  boxShadow: `0 0 10px ${color}40`,
                }}
              />
              <div className="flex flex-col gap-1 min-w-0">
                <span
                  className={item.status === "error" ? "text-red-300" : "text-moon-bone"}
                >
                  {item.description}
                </span>
                <div className="text-moon-dim text-[10px]">
                  <span
                    className="uppercase tracking-wider opacity-70"
                    style={{ fontSize: "9px", color }}
                  >
                    {item.source}
                  </span>
                  {" "}&bull;{" "}
                  {formatTime(item.timestamp)}
                </div>
                {(runId || taskId) && (
                  <div className="flex flex-wrap gap-2 pt-1 text-[9px] font-mono">
                    {runId && (
                      <button
                        onClick={() => setSelectedRunId(runId)}
                        className="px-2 py-[2px] border border-border-subtle rounded text-moon-dim hover:text-moon-bone transition-colors"
                        title="View run trace"
                      >
                        run:{runId.slice(0, 18)}
                      </button>
                    )}
                    {taskId && (
                      <button
                        onClick={() => setSelectedTaskId(taskId)}
                        className="px-2 py-[2px] border border-border-subtle rounded text-moon-dim hover:text-moon-bone transition-colors"
                        title="Open task quick detail"
                      >
                        task:{taskId.slice(0, 8)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="p-6 text-xs text-moon-dim opacity-50 text-center">
            No activity yet
          </div>
        )}
      </div>

      {selectedRunId && (
        <div className="border-t border-border-subtle p-4 bg-black/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-moon-dim">
              Run Trace
            </span>
            <button
              onClick={() => setSelectedRunId(null)}
              className="text-[10px] text-moon-dim hover:text-moon-bone"
            >
              Close
            </button>
          </div>

          <div className="text-[10px] font-mono text-moon-bone mb-2 break-all">
            {selectedRunId}
          </div>

          {traceLoading ? (
            <div className="text-[10px] text-moon-dim">Loading trace...</div>
          ) : !runTrace ? (
            <div className="text-[10px] text-moon-dim">No trace data.</div>
          ) : (
            <div className="text-[10px] text-moon-dim flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Activities: {runTrace.activities.length}</span>
                <span>
                  Errors: {runTrace.activities.filter((a) => a.status === "error").length}
                </span>
              </div>
              <span>Timeline Events: {runTrace.timelineEvents.length}</span>
              <div className="max-h-32 overflow-y-auto border border-border-subtle rounded p-2 flex flex-col gap-1">
                {runTrace.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <span className={a.status === "error" ? "text-red-300 truncate" : "truncate"}>
                      {a.type}
                    </span>
                    <div className="flex items-center gap-2">
                      {a.metadata?.taskId && (
                        <button
                          onClick={() => setSelectedTaskId(String(a.metadata?.taskId))}
                          className="px-1 border border-border-subtle rounded hover:text-moon-bone"
                        >
                          t:{String(a.metadata?.taskId).slice(0, 6)}
                        </button>
                      )}
                      <span className="opacity-60">{formatTime(a.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {taskDetail && (
                <div className="border border-border-subtle rounded p-2 flex flex-col gap-1">
                  <span className="text-moon-bone truncate">{taskDetail.title}</span>
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">{taskDetail.status}</span>
                    <span className="opacity-70">{taskDetail.priority}</span>
                  </div>
                  <div className="opacity-60 truncate">
                    {taskDetail.assignee ? `assignee: ${taskDetail.assignee}` : "unassigned"}
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedRunId(null);
                  setRunTrace(null);
                  setSelectedTaskId(null);
                  setTaskDetail(null);
                }}
                className="self-start px-2 py-[2px] border border-border-subtle rounded hover:text-moon-bone"
              >
                Clear Run Filter
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
