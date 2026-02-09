"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { getBotColor } from "@/lib/bot-colors";

interface Agent {
  id: string;
  name: string;
  symbol: string;
  role: string | null;
  color: string;
  status: string;
  currentTask: string | null;
  specialization: string | null;
  memoryUsage: number;
  tokenVelocity: number;
  successRate: number;
  uptime: string;
  model: string;
  temperature: string;
  memoryStrategy: string;
  basePersona: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  tokens?: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  status: string | null;
  source: string;
  timestamp: string;
  metadata: unknown;
}

const STATUS_COLORS: Record<string, string> = {
  online: "#4CAF50",
  busy: "#FFA726",
  idle: "#8A857A",
  offline: "#8B4B4B",
};

const STATUS_LABELS: Record<string, string> = {
  online: "Online",
  busy: "Busy",
  idle: "Idle",
  offline: "Offline",
};

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

const TASK_STATUS_COLORS: Record<string, string> = {
  draft: "#8A857A",
  in_progress: "#FFA726",
  pending_review: "#C4A496",
  approved: "#4CAF50",
  archived: "#555",
  failed: "#8B4B4B",
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [configModel, setConfigModel] = useState("");
  const [configTemp, setConfigTemp] = useState("");
  const [configMemStrategy, setConfigMemStrategy] = useState("rolling_context");
  const [configPersona, setConfigPersona] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [confirmRestart, setConfirmRestart] = useState(false);

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setAgent(data);
      setConfigModel(data.model || "");
      setConfigTemp(data.temperature || "");
      setConfigMemStrategy(data.memoryStrategy || "rolling_context");
      setConfigPersona(data.basePersona || "");
    } catch {
      // ignore
    }
  }, [id]);

  const fetchTasks = useCallback(async (agentName: string) => {
    try {
      const res = await fetch(`/api/tasks?assignee=${encodeURIComponent(agentName)}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchActivities = useCallback(async (agentName: string) => {
    try {
      const res = await fetch(`/api/feed?scope=agent:${encodeURIComponent(agentName)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAgent().then(() => setLoading(false));
  }, [fetchAgent]);

  useEffect(() => {
    if (agent?.name) {
      fetchTasks(agent.name);
      fetchActivities(agent.name);
    }
  }, [agent?.name, fetchTasks, fetchActivities]);

  const handleSaveConfig = async () => {
    if (!agent) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: configModel,
          temperature: configTemp,
          memoryStrategy: configMemStrategy,
          basePersona: configPersona,
        }),
      });
      if (res.ok) {
        setSaveMessage("Configuration saved");
        fetchAgent();
      } else {
        setSaveMessage("Failed to save");
      }
    } catch {
      setSaveMessage("Failed to save");
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleRestart = async () => {
    if (!agent) return;
    try {
      await fetch(`/api/agents/${id}/restart`, { method: "POST" });
      setConfirmRestart(false);
      fetchAgent();
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = useCallback(async () => {}, []);
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-void text-moon-dim font-mono text-sm">
        Loading agent…
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-screen flex items-center justify-center bg-void text-moon-dim font-mono text-sm">
        Agent not found
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden grid"
      style={{
        gridTemplateColumns: "260px 1fr",
        gridTemplateRows: "60px 1fr",
      }}
    >
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      <Sidebar />

      <main className="flex overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#111_0%,#030303_60%)]">
        <div className="flex-1 overflow-y-auto p-8">
          {/* Agent Header Section */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl"
                style={{ color: agent.color, borderColor: agent.color }}
              >
                {agent.symbol}
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="font-serif text-2xl text-moon-bone m-0 leading-none">
                  {agent.name}
                </h1>
                {agent.role && (
                  <span
                    className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full border w-fit"
                    style={{ color: agent.color, borderColor: `${agent.color}40` }}
                  >
                    {agent.role}
                  </span>
                )}
                {agent.specialization && (
                  <span className="text-[12px] text-moon-dim mt-1">
                    {agent.specialization}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: STATUS_COLORS[agent.status] || STATUS_COLORS.offline }}
                />
                <span className="text-[11px] font-mono text-moon-dim">
                  {STATUS_LABELS[agent.status] || "Offline"}
                </span>
              </div>
              {confirmRestart ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-moon-dim font-mono">Confirm?</span>
                  <button
                    onClick={handleRestart}
                    className="text-[10px] font-mono px-3 py-1 border rounded transition-colors bg-[#3D1515] border-[#6B2020] text-[#E88] hover:bg-[#4D1B1B] cursor-pointer"
                  >
                    Yes, Restart
                  </button>
                  <button
                    onClick={() => setConfirmRestart(false)}
                    className="text-[10px] font-mono px-3 py-1 border border-border-subtle text-moon-dim hover:text-moon-bone transition-colors cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRestart(true)}
                  className="text-[10px] font-mono px-3 py-1 border rounded transition-colors bg-[#1A0A0A] border-[#3D1515] text-[#C88] hover:bg-[#2D1212] hover:border-[#6B2020] cursor-pointer"
                >
                  Restart Instance
                </button>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-void-depth border border-border-subtle rounded-lg">
              <span className="text-[10px] font-mono text-moon-dim uppercase tracking-wider block mb-2">
                Memory Usage
              </span>
              <span className="text-xl font-mono text-moon-bone">{agent.memoryUsage}%</span>
              <div className="mt-2 h-1 bg-[#222] rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${agent.memoryUsage}%`,
                    background:
                      agent.memoryUsage > 80
                        ? "#8B4B4B"
                        : agent.memoryUsage > 60
                          ? "#FFA726"
                          : "#4CAF50",
                  }}
                />
              </div>
            </div>
            <div className="p-4 bg-void-depth border border-border-subtle rounded-lg">
              <span className="text-[10px] font-mono text-moon-dim uppercase tracking-wider block mb-2">
                Token Velocity
              </span>
              <span className="text-xl font-mono text-moon-bone">{agent.tokenVelocity}</span>
              <span className="text-[10px] text-moon-dim font-mono">/min</span>
            </div>
            <div className="p-4 bg-void-depth border border-border-subtle rounded-lg">
              <span className="text-[10px] font-mono text-moon-dim uppercase tracking-wider block mb-2">
                Success Rate
              </span>
              <span className="text-xl font-mono text-moon-bone">{agent.successRate}%</span>
            </div>
            <div className="p-4 bg-void-depth border border-border-subtle rounded-lg">
              <span className="text-[10px] font-mono text-moon-dim uppercase tracking-wider block mb-2">
                Uptime
              </span>
              <span className="text-xl font-mono text-moon-bone">{agent.uptime}</span>
            </div>
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Task History */}
            <div>
              <h2 className="font-serif text-lg text-moon-bone mb-4">Task History</h2>
              <div className="border border-border-subtle rounded-lg overflow-hidden">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-border-subtle bg-void-depth">
                      <th className="text-left p-3 text-moon-dim font-normal uppercase tracking-wider text-[10px]">
                        Task
                      </th>
                      <th className="text-left p-3 text-moon-dim font-normal uppercase tracking-wider text-[10px]">
                        Status
                      </th>
                      <th className="text-left p-3 text-moon-dim font-normal uppercase tracking-wider text-[10px]">
                        Time
                      </th>
                      <th className="text-right p-3 text-moon-dim font-normal uppercase tracking-wider text-[10px]">
                        Tokens
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-border-subtle last:border-b-0 hover:bg-void-depth transition-colors"
                      >
                        <td className="p-3 text-moon-bone max-w-[200px] truncate">
                          {task.title}
                        </td>
                        <td className="p-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
                            style={{
                              color: TASK_STATUS_COLORS[task.status] || "#8A857A",
                              border: `1px solid ${(TASK_STATUS_COLORS[task.status] || "#8A857A")}40`,
                            }}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 text-moon-dim">{formatTime(task.createdAt)}</td>
                        <td className="p-3 text-right text-moon-dim">
                          {task.tokens ?? "—"}
                        </td>
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-moon-dim opacity-50"
                        >
                          No tasks found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Configuration Panel */}
            <div>
              <h2 className="font-serif text-lg text-moon-bone mb-4">Configuration</h2>
              <div className="border border-border-subtle rounded-lg p-5 flex flex-col gap-4 bg-void-depth">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-moon-dim uppercase tracking-wider">
                    Model
                  </label>
                  <input
                    type="text"
                    value={configModel}
                    onChange={(e) => setConfigModel(e.target.value)}
                    className="bg-void border border-border-subtle text-moon-bone px-3 py-2 text-xs font-mono rounded focus:outline-none focus:border-moon-dim transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-moon-dim uppercase tracking-wider">
                    Temperature
                  </label>
                  <input
                    type="text"
                    value={configTemp}
                    onChange={(e) => setConfigTemp(e.target.value)}
                    className="bg-void border border-border-subtle text-moon-bone px-3 py-2 text-xs font-mono rounded focus:outline-none focus:border-moon-dim transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-moon-dim uppercase tracking-wider">
                    Memory Strategy
                  </label>
                  <select
                    value={configMemStrategy}
                    onChange={(e) => setConfigMemStrategy(e.target.value)}
                    className="bg-void border border-border-subtle text-moon-bone px-3 py-2 text-xs font-mono rounded focus:outline-none focus:border-moon-dim transition-colors appearance-none cursor-pointer"
                  >
                    <option value="rolling_context">Rolling Context</option>
                    <option value="full_context">Full Context</option>
                    <option value="summary">Summary</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-moon-dim uppercase tracking-wider">
                    Base Persona
                  </label>
                  <textarea
                    value={configPersona}
                    onChange={(e) => setConfigPersona(e.target.value)}
                    rows={3}
                    className="bg-void border border-border-subtle text-moon-bone px-3 py-2 text-xs font-mono rounded focus:outline-none focus:border-moon-dim transition-colors resize-none"
                  />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="text-[10px] font-mono px-4 py-1.5 border border-flesh-dim text-flesh hover:bg-flesh-dark transition-colors rounded cursor-pointer disabled:opacity-50 bg-transparent"
                  >
                    {saving ? "Saving…" : "Save Configuration"}
                  </button>
                  {saveMessage && (
                    <span
                      className="text-[10px] font-mono"
                      style={{
                        color: saveMessage === "Configuration saved" ? "#4CAF50" : "#8B4B4B",
                      }}
                    >
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Neural Trace */}
        <aside
          className="w-[320px] shrink-0 border-l border-border-subtle flex flex-col"
          style={{ background: "rgba(5,5,5,0.5)" }}
        >
          <div className="px-6 py-5 border-b border-border-subtle flex justify-between items-center text-moon-bone font-serif text-base">
            <span>{agent.name}&apos;s Neural Trace</span>
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
                  <div className="flex flex-col gap-1">
                    <span className="text-moon-bone">{item.description}</span>
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
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div className="p-6 text-xs text-moon-dim opacity-50 text-center">
                No trace data yet
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
