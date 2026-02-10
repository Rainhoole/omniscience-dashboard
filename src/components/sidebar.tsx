"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  specialization?: string | null;
  memoryUsage?: number | null;
  tokenVelocity?: number | null;
  successRate?: number | null;
  uptime?: string | null;
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

const RISK_COLORS: Record<"low" | "medium" | "high", string> = {
  low: "#4CAF50",
  medium: "#FFA726",
  high: "#D95F5F",
};

function formatOpTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getRiskLevel(bot: Bot): "low" | "medium" | "high" {
  if (bot.status === "offline") return "high";

  const memory = bot.memoryUsage ?? 0;
  const success = bot.successRate ?? 100;

  if (memory >= 85 || success < 80) return "high";
  if (memory >= 70 || success < 90 || bot.status === "busy") return "medium";
  return "low";
}

export function Sidebar() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionState, setActionState] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({
    name: "",
    role: "",
    symbol: "",
    color: "#C4A496",
  });

  const fetchAll = useCallback(() => {
    fetch("/api/bots")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBots(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch("/api/system/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setHealth(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 10000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const counts = useMemo(() => {
    let online = 0;
    let busy = 0;
    let highRisk = 0;
    for (const bot of bots) {
      if (bot.status === "online") online += 1;
      if (bot.status === "busy") busy += 1;
      if (getRiskLevel(bot) === "high") highRisk += 1;
    }
    return { online, busy, highRisk };
  }, [bots]);

  const setBotAction = (botId: string, label: string | null) => {
    setActionState((prev) => {
      const next = { ...prev };
      if (label) next[botId] = label;
      else delete next[botId];
      return next;
    });
  };

  const runRestart = async (botId: string) => {
    setBotAction(botId, "Restarting...");
    try {
      const res = await fetch(`/api/agents/${botId}/restart`, { method: "POST" });
      if (!res.ok) throw new Error("restart_failed");
      setNotice("Agent restarted");
      fetchAll();
    } catch {
      setNotice("Restart failed");
    }
    setBotAction(botId, null);
    setTimeout(() => setNotice(""), 2000);
  };

  const runHeartbeatTest = async (botId: string) => {
    setBotAction(botId, "Testing...");
    try {
      const res = await fetch(`/api/agents/${botId}/heartbeat-test`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("heartbeat_failed");
      setNotice("Heartbeat test passed");
      fetchAll();
    } catch {
      setNotice("Heartbeat test failed");
    }
    setBotAction(botId, null);
    setTimeout(() => setNotice(""), 2200);
  };

  const submitCreate = async () => {
    setCreateError("");
    const name = createForm.name.trim();
    if (!name) {
      setCreateError("Name is required");
      return;
    }

    const symbol = (createForm.symbol.trim() || name.slice(0, 1) || "●").toUpperCase();

    setCreating(true);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role: createForm.role.trim() || null,
          symbol,
          color: createForm.color,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data?.error || "Create failed");
        setCreating(false);
        return;
      }

      if (data?.id) {
        await fetch(`/api/agents/${data.id}/heartbeat-test`, { method: "POST" }).catch(
          () => {},
        );
      }

      setCreateForm({ name: "", role: "", symbol: "", color: "#C4A496" });
      setShowCreate(false);
      setNotice("New agent created");
      fetchAll();
      if (data?.id) router.push(`/agent/${data.id}`);
    } catch {
      setCreateError("Create failed");
    }
    setCreating(false);
    setTimeout(() => setNotice(""), 2500);
  };

  return (
    <aside className="border-r border-border-subtle p-6 flex flex-col gap-8 overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-moon-dim opacity-70 font-serif italic">Active Agents</span>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="text-[10px] font-mono border border-border-subtle px-2 py-1 text-moon-dim hover:text-moon-bone hover:border-flesh-dim transition-colors"
          >
            {showCreate ? "Close" : "+ New Agent"}
          </button>
        </div>

        <div className="text-[10px] text-moon-dim mb-4 flex flex-wrap gap-3">
          <span>Online {counts.online}</span>
          <span>Busy {counts.busy}</span>
          <span style={{ color: counts.highRisk > 0 ? "#D95F5F" : undefined }}>
            High risk {counts.highRisk}
          </span>
        </div>

        {showCreate && (
          <div className="mb-4 border border-border-subtle rounded-lg p-3 bg-void-depth flex flex-col gap-2">
            <input
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                  symbol: prev.symbol || e.target.value.slice(0, 1).toUpperCase(),
                }))
              }
              placeholder="Agent name"
              className="bg-void border border-border-subtle text-moon-bone px-2 py-1.5 text-[11px] rounded focus:outline-none focus:border-moon-dim"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder="Role"
                className="bg-void border border-border-subtle text-moon-bone px-2 py-1.5 text-[11px] rounded focus:outline-none focus:border-moon-dim"
              />
              <input
                value={createForm.symbol}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, symbol: e.target.value }))
                }
                placeholder="Symbol"
                maxLength={2}
                className="bg-void border border-border-subtle text-moon-bone px-2 py-1.5 text-[11px] rounded focus:outline-none focus:border-moon-dim"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={createForm.color}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, color: e.target.value }))
                }
                className="h-7 w-9 bg-void border border-border-subtle rounded cursor-pointer"
              />
              <button
                onClick={submitCreate}
                disabled={creating}
                className="text-[10px] font-mono border border-flesh-dim px-3 py-1.5 text-flesh hover:bg-flesh-dark transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create + Ping"}
              </button>
            </div>
            {createError && <div className="text-[10px] text-[#D95F5F]">{createError}</div>}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {bots.map((bot) => {
            const risk = getRiskLevel(bot);
            const actionText = actionState[bot.id];

            return (
              <div
                key={bot.id}
                className="p-3 border border-transparent rounded-xl transition-all duration-200 cursor-pointer hover:border-border-subtle hover:bg-void-depth"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.01) 100%)",
                }}
                onClick={() => router.push(`/agent/${bot.id}`)}
              >
                <div className="flex items-start gap-3">
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

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-moon-bone truncate">{bot.name}</span>
                      {bot.role && (
                        <span className="text-[9px] uppercase tracking-wider text-moon-dim border border-border-subtle px-1.5 py-0.5 rounded">
                          {bot.role}
                        </span>
                      )}
                      <span
                        className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: RISK_COLORS[risk],
                          border: `1px solid ${RISK_COLORS[risk]}55`,
                        }}
                      >
                        {risk} risk
                      </span>
                    </div>

                    <div className="text-[11px] text-moon-dim truncate mt-1">
                      {bot.currentTask || "Idle"}
                    </div>

                    <div className="text-[10px] text-moon-dim opacity-80 mt-1 flex gap-2 flex-wrap">
                      <span>SR {bot.successRate ?? 100}%</span>
                      <span>Mem {bot.memoryUsage ?? 0}%</span>
                      <span>TV {bot.tokenVelocity ?? 0}/m</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => runHeartbeatTest(bot.id)}
                    disabled={!!actionText}
                    className="text-[9px] font-mono border border-border-subtle px-2 py-1 text-moon-dim hover:text-moon-bone hover:border-flesh-dim transition-colors disabled:opacity-50"
                  >
                    Ping
                  </button>
                  <button
                    onClick={() => runRestart(bot.id)}
                    disabled={!!actionText}
                    className="text-[9px] font-mono border border-border-subtle px-2 py-1 text-moon-dim hover:text-moon-bone hover:border-flesh-dim transition-colors disabled:opacity-50"
                  >
                    Restart
                  </button>
                  <button
                    onClick={() => router.push(`/agent/${bot.id}`)}
                    className="text-[9px] font-mono border border-border-subtle px-2 py-1 text-moon-dim hover:text-moon-bone hover:border-flesh-dim transition-colors"
                  >
                    Open
                  </button>
                </div>

                {actionText && (
                  <div className="text-[9px] text-moon-dim mt-2 opacity-80">{actionText}</div>
                )}
              </div>
            );
          })}

          {bots.length === 0 && (
            <div className="text-xs text-moon-dim opacity-50">No agents registered</div>
          )}
        </div>

        {notice && <div className="text-[10px] text-flesh mt-3">{notice}</div>}
      </div>

      <div className="mt-auto pb-1">
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
              <div
                key={op.id}
                className="text-[10px] text-moon-dim border border-border-subtle rounded px-2 py-1"
              >
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
