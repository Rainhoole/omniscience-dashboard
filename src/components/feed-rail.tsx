"use client";

import { useEffect, useState } from "react";
import { getBotColor } from "@/lib/bot-colors";

interface Activity {
  id: string;
  type: string;
  description: string;
  status: string | null;
  source: string;
  timestamp: string;
  metadata: unknown;
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

  useEffect(() => {
    const fetchActivities = () => {
      fetch("/api/activities?limit=30")
        .then((r) => r.json())
        .then(setActivities)
        .catch(() => {});
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

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
            No activity yet
          </div>
        )}
      </div>
    </aside>
  );
}
