"use client";

import { useEffect, useState } from "react";

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

const STATUS_COLORS: Record<string, string> = {
  online: "#4CAF50",
  busy: "#FFA726",
  idle: "#8A857A",
  offline: "#8B4B4B",
};

export function Sidebar() {
  const [bots, setBots] = useState<Bot[]>([]);

  useEffect(() => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then(setBots)
      .catch(() => {});
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
          <div className="w-[85%] h-full bg-moon-dim" />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-moon-dim">
          <span>Memory: 85%</span>
          <span>API: Stable</span>
        </div>
      </div>
    </aside>
  );
}
