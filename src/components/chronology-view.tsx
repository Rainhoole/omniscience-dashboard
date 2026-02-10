"use client";

import { useEffect, useState } from "react";
import { getBotColor } from "@/lib/bot-colors";

interface TimelineEvent {
  id: string;
  agentId: string | null;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
  metadata: unknown;
}

type AgentFilter = "all" | string;
type RangeFilter = "24h" | "7d" | "30d";

const RANGES: RangeFilter[] = ["24h", "7d", "30d"];

const HOUR_SLOTS = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatGroupDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getTimeGroup(ts: string): string {
  const now = new Date();
  const date = new Date(ts);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 86400000);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This Week";
  return "Earlier";
}

interface TimelineGroup {
  label: string;
  dateLabel: string;
  events: TimelineEvent[];
}

function groupEvents(events: TimelineEvent[]): TimelineGroup[] {
  const map = new Map<string, TimelineEvent[]>();
  const order = ["Today", "Yesterday", "This Week", "Earlier"];

  for (const ev of events) {
    const group = getTimeGroup(ev.occurredAt);
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(ev);
  }

  const groups: TimelineGroup[] = [];
  for (const label of order) {
    const evts = map.get(label);
    if (evts && evts.length > 0) {
      groups.push({
        label,
        dateLabel: formatGroupDate(evts[0].occurredAt),
        events: evts,
      });
    }
  }
  return groups;
}

function computeStats(events: TimelineEvent[]) {
  const agentCounts: Record<string, number> = {};
  const hourBuckets = [0, 0, 0, 0, 0, 0];

  for (const ev of events) {
    const agent = ev.agentId || "unknown";
    agentCounts[agent] = (agentCounts[agent] || 0) + 1;

    const hour = new Date(ev.occurredAt).getHours();
    hourBuckets[Math.floor(hour / 4)]++;
  }

  let topContributor = "—";
  let topCount = 0;
  for (const [agent, count] of Object.entries(agentCounts)) {
    if (count > topCount) {
      topCount = count;
      topContributor = agent;
    }
  }

  const maxBucket = Math.max(...hourBuckets, 1);

  const totalPossibleSlots = events.length > 0 ? events.length : 1;
  const uniqueAgents = Object.keys(agentCounts).length || 1;
  const efficiency = Math.min(
    99,
    Math.round(70 + (topCount / totalPossibleSlots) * 20 + uniqueAgents * 3)
  );

  return { efficiency, topContributor, hourBuckets, maxBucket };
}

export function ChronologyView() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [agent, setAgent] = useState<AgentFilter>("all");
  const [range, setRange] = useState<RangeFilter>("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch(`/api/timeline?agent=${agent}&range=${range}`)
      .then((r) => r.json())
      .then((data: TimelineEvent[]) => {
        if (alive) setEvents(data);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [agent, range]);

  const groups = groupEvents(events);
  const stats = computeStats(events);

  const agentOptions: { value: AgentFilter; label: string }[] = [
    { value: "all", label: "All Agents" },
    ...Array.from(new Set(events.map((e) => e.agentId).filter(Boolean) as string[]))
      .sort()
      .map((v) => ({ value: v, label: v })),
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Main timeline area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter bar */}
        <div className="px-8 py-4 border-b border-border-subtle flex items-center gap-4">
          <select
            value={agent}
            onChange={(e) => {
              setLoading(true);
              setAgent(e.target.value as AgentFilter);
            }}
            className="bg-void-depth border border-border-subtle text-moon-bone text-[11px] font-mono px-3 py-1.5 rounded-sm focus:outline-none focus:border-flesh-dim appearance-none cursor-pointer"
          >
            {agentOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setLoading(true);
                  setRange(r);
                }}
                className={`px-3 py-1 text-[10px] tracking-[0.15em] uppercase font-mono border transition-colors ${
                  range === r
                    ? "border-flesh-dim text-moon-bone bg-[rgba(196,164,150,0.08)]"
                    : "border-border-subtle text-moon-dim hover:text-moon-bone hover:border-flesh-dim"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {loading && (
            <span className="text-[10px] text-moon-dim font-mono opacity-50 ml-auto">
              Loading…
            </span>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {groups.length === 0 && !loading && (
            <div className="text-center text-moon-dim opacity-50 py-16 font-serif text-lg">
              No events found.
            </div>
          )}

          <div className="relative max-w-3xl mx-auto">
            {/* Center line */}
            <div
              className="absolute left-[18px] top-0 w-px h-full z-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
              }}
            />

            {groups.map((group) => (
              <div key={group.label} className="mb-8">
                {/* Group header */}
                <div className="relative flex items-center gap-3 mb-4 pl-10">
                  <div
                    className="absolute left-[14px] w-[9px] h-[9px] rounded-full z-10"
                    style={{
                      backgroundColor: "var(--color-moon-dim)",
                      boxShadow: "0 0 8px rgba(138,133,122,0.3)",
                    }}
                  />
                  <h3 className="font-serif text-base text-moon-bone">
                    {group.label}
                    <span className="text-moon-dim text-[11px] font-mono ml-3">
                      — {group.dateLabel}
                    </span>
                  </h3>
                </div>

                {/* Events */}
                <div className="flex flex-col gap-2">
                  {group.events.map((ev) => {
                    const color = ev.agentId
                      ? getBotColor(ev.agentId)
                      : "var(--color-moon-dim)";
                    return (
                      <div key={ev.id} className="relative flex gap-4 pl-10">
                        {/* Dot */}
                        <div
                          className="absolute left-[14px] top-3 w-[9px] h-[9px] rounded-full bg-void border-2 z-10 shrink-0"
                          style={{
                            borderColor: color,
                            boxShadow: `0 0 10px ${color}40`,
                          }}
                        />

                        {/* Card */}
                        <div
                          className="flex-1 bg-void-depth rounded p-4 border border-border-subtle"
                          style={{ borderLeftWidth: "2px", borderLeftColor: color }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-moon-bone font-mono font-medium leading-snug">
                                {ev.title}
                              </div>
                              {ev.description && (
                                <div className="text-[11px] text-moon-dim mt-1 leading-relaxed">
                                  {ev.description}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-moon-dim font-mono whitespace-nowrap mt-0.5">
                              {formatTimestamp(ev.occurredAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="inline-block w-[6px] h-[6px] rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span
                              className="text-[9px] uppercase tracking-[0.15em] font-mono"
                              style={{ color }}
                            >
                              {ev.agentId || "system"}
                            </span>
                            <span className="text-[9px] text-moon-dim font-mono opacity-50 ml-1">
                              {ev.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar — Activity Stats */}
      <aside
        className="w-[320px] border-l border-border-subtle flex flex-col overflow-y-auto shrink-0"
        style={{ background: "rgba(5,5,5,0.5)" }}
      >
        <div className="px-6 py-5 border-b border-border-subtle text-moon-bone font-serif text-base">
          Activity Stats
        </div>

        <div className="px-6 py-6 flex flex-col gap-8">
          {/* Efficiency Score */}
          <div className="flex flex-col items-center gap-1 py-4">
            <span className="text-[48px] font-mono font-medium text-moon-bone leading-none">
              {stats.efficiency}%
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-moon-dim font-mono">
              Efficiency Score
            </span>
          </div>

          {/* Top Contributor */}
          <div className="border-t border-border-subtle pt-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-moon-dim font-mono mb-3">
              Top Contributor
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-[8px] h-[8px] rounded-full"
                style={{ backgroundColor: getBotColor(stats.topContributor) }}
              />
              <span className="text-[13px] font-mono text-moon-bone capitalize">
                {stats.topContributor}
              </span>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="border-t border-border-subtle pt-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-moon-dim font-mono mb-4">
              Peak Hours
            </div>
            <div className="flex items-end gap-2 h-[100px]">
              {stats.hourBuckets.map((count, i) => {
                const height = Math.max(4, (count / stats.maxBucket) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${height}%`,
                        backgroundColor: "var(--color-flesh)",
                        opacity: 0.3 + (count / stats.maxBucket) * 0.7,
                      }}
                    />
                    <span className="text-[8px] text-moon-dim font-mono whitespace-nowrap">
                      {HOUR_SLOTS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event count */}
          <div className="border-t border-border-subtle pt-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-moon-dim font-mono mb-2">
              Total Events
            </div>
            <span className="text-[20px] font-mono text-moon-bone">
              {events.length}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
