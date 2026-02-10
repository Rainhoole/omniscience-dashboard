"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Bot {
  id: string;
  name: string;
  symbol: string;
  role: string | null;
  color: string;
  status: string;
  currentTask: string | null;
  lastSeen: string | null;
}

interface HealthSnapshot {
  memoryPercent: number;
  apiStatus: "Stable" | "Degraded" | "Critical";
  onlineAgents: number;
  totalAgents: number;
  successRate: number;
  recentErrorCount: number;
  recentOps: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    actorId: string | null;
    createdAt: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  online: "#4CAF50",
  busy: "#FFA726",
  idle: "#8A857A",
  offline: "#8B4B4B",
};

function formatOpTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function Sidebar() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);

  useEffect(() => {
    const fetchAll = () => {
      fetch("/api/bots")
        .then((r) => r.json())
        .then(setBots)
        .catch(() => {});

      fetch("/api/system/health")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setHealth(data);
        })
        .catch(() => {});
    };

    fetchAll();
    const timer = setInterval(fetchAll, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="border-r border-border-subtle p-6 flex flex-col gap-8">
      <div>
        <span className="block mb-4 text-sm text-moon-dim opacity-70 font-serif italic">
          Active Agents
        </span>
        <div className="flex flex-col gap-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="flex items-center gap-3 p-3 border border-transparent rounded-xl transition-all duration-200 cursor-pointer hover:border-border-subtle hover:bg-void-depth"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.01) 100%)",
              }}
              onClick={() => router.push(`/agent/${bot.id}`)}
            >
              <div
                className="relative w-8 h-8 rounded-full border flex items-center justify-center text-[10px]"
                style={{ color: bot.color, borderColor: bot.color }}
              >
                {bot.symbol}
                <div
                  className="absolute bottom-[-2px] right-[-2px] w-2 h-2 rounded-full"
                  style={{
                    background: "#030303",
                    border: "2px solid #030303",
                    boxShadow: `inset 0 0 0 4px ${STATUS_COLORS[bot.status] || STATUS_COLORS.offline}`,
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-moon-bone">
                  {bot.name}
                  {bot.role && ` (${bot.role})`}
                </span>
                <span className="text-[11px] text-moon-dim">
                  {bot.currentTask || "Idle"}
                </span>
              </div>
            </div>
          ))}
          {bots.length === 0 && (
            <div className="text-xs text-moon-dim opacity-50">
              No agents registered
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <span className="block mb-4 text-sm text-moon-dim opacity-70 font-serif italic">
          System Health
        </span>
        <div className="h-1 bg-[#222] rounded overflow-hidden">
          <div
            className="h-full bg-moon-dim transition-all duration-700"
            style={{ width: `${health?.memoryPercent ?? 0}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-moon-dim">
          <span>Memory: {health?.memoryPercent ?? 0}%</span>
          <span>API: {health?.apiStatus ?? "—"}</span>
        </div>
        <div className="mt-2 text-[10px] text-moon-dim flex justify-between">
          <span>
            Agents: {health?.onlineAgents ?? 0}/{health?.totalAgents ?? bots.length}
          </span>
          <span>SR: {health?.successRate ?? 0}%</span>
        </div>

        <div className="mt-5">
          <span className="block mb-2 text-xs text-moon-dim opacity-70 font-serif italic">
            Recent Operator Actions
          </span>
          <div className="flex flex-col gap-2 max-h-28 overflow-y-auto pr-1">
            {(health?.recentOps ?? []).map((op) => (
              <div key={op.id} className="text-[10px] text-moon-dim border border-border-subtle rounded px-2 py-1">
                <div className="text-moon-bone truncate">{op.action}</div>
                <div className="opacity-70 truncate">
                  {op.resourceType}
                  {op.resourceId ? `:${op.resourceId.slice(0, 8)}` : ""}
                  {" • "}
                  {formatOpTime(op.createdAt)}
                </div>
              </div>
            ))}
            {(health?.recentOps ?? []).length === 0 && (
              <div className="text-[10px] text-moon-dim opacity-50">No recent actions</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
