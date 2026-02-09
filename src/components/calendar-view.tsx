"use client";

import { useEffect, useState, useCallback } from "react";
import { getBotColor } from "@/lib/bot-colors";
import { FeedRailScheduled } from "@/components/feed-rail-scheduled";

interface ScheduledTask {
  id: string;
  title: string;
  type: string;
  cronExpression: string | null;
  scheduledAt: string | null;
  status: string;
  assignee: string | null;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function parseCronDaysOfWeek(cron: string): number[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return [];
  const dowField = parts[4];
  if (dowField === "*") return [0, 1, 2, 3, 4, 5, 6];

  const days: number[] = [];
  for (const segment of dowField.split(",")) {
    if (segment.includes("-")) {
      const [start, end] = segment.split("-").map(Number);
      for (let i = start; i <= end; i++) days.push(i % 7);
    } else if (segment.includes("/")) {
      const [, step] = segment.split("/").map(Number);
      for (let i = 0; i < 7; i += step) days.push(i);
    } else {
      days.push(Number(segment) % 7);
    }
  }
  return days;
}

function cronMatchesDate(cron: string, date: Date): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return false;

  const [, , domField, monField, dowField] = parts;
  const dom = date.getDate();
  const mon = date.getMonth() + 1;
  const dow = date.getDay();

  const matchesField = (field: string, value: number): boolean => {
    if (field === "*") return true;
    for (const segment of field.split(",")) {
      if (segment.includes("-")) {
        const [start, end] = segment.split("-").map(Number);
        if (value >= start && value <= end) return true;
      } else if (segment.includes("/")) {
        const [base, step] = segment.split("/");
        const baseVal = base === "*" ? 0 : Number(base);
        const stepVal = Number(step);
        if ((value - baseVal) % stepVal === 0 && value >= baseVal) return true;
      } else {
        if (Number(segment) === value) return true;
      }
    }
    return false;
  };

  return (
    matchesField(domField, dom) &&
    matchesField(monField, mon) &&
    matchesField(dowField, dow)
  );
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ScheduledTask[];
}

function buildCalendarDays(
  year: number,
  month: number,
  tasks: ScheduledTask[]
): CalendarDay[] {
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const startDow = getStartDayOfWeek(year, month);

  const days: CalendarDay[] = [];

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(prevYear, prevMonth, daysInPrevMonth - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      events: getEventsForDate(d, tasks),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      events: getEventsForDate(date, tasks),
    });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(nextYear, nextMonth, d);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        events: getEventsForDate(date, tasks),
      });
    }
  }

  return days;
}

function getEventsForDate(date: Date, tasks: ScheduledTask[]): ScheduledTask[] {
  return tasks.filter((task) => {
    if (task.nextRun && isSameDay(new Date(task.nextRun), date)) return true;
    if (task.scheduledAt && isSameDay(new Date(task.scheduledAt), date))
      return true;
    if (task.cronExpression && cronMatchesDate(task.cronExpression, date))
      return true;
    return false;
  });
}

function CalendarEvent({ task }: { task: ScheduledTask }) {
  const color = task.assignee
    ? getBotColor(task.assignee)
    : "var(--color-moon-dim)";

  return (
    <div
      className="text-[10px] px-2 py-1 rounded-sm bg-void-depth mb-1 truncate"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <div className="flex items-center gap-1">
        {task.cronExpression && (
          <span
            className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-moon-bone truncate">{task.title}</span>
      </div>
    </div>
  );
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);

  useEffect(() => {
    fetch("/api/scheduled-tasks")
      .then((r) => r.json())
      .then((data: ScheduledTask[]) => setTasks(data))
      .catch(() => {});
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }, []);

  const prevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const days = buildCalendarDays(year, month, tasks);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-moon-bone">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-[10px] tracking-[0.15em] uppercase border border-border-subtle text-moon-dim hover:text-moon-bone hover:border-flesh-dim transition-colors font-mono"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center text-moon-dim hover:text-moon-bone border border-border-subtle transition-colors"
            >
              ‹
            </button>
            <button
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center text-moon-dim hover:text-moon-bone border border-border-subtle transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        <div className="border border-border-subtle">
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="p-3 text-right text-[10px] uppercase tracking-widest text-moon-dim border-r border-b border-border-subtle bg-[rgba(255,255,255,0.02)] last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-[120px] p-2 border-r border-b border-border-subtle ${
                  idx % 7 === 6 ? "border-r-0" : ""
                } ${!day.isCurrentMonth ? "opacity-30" : ""}`}
              >
                <div className="text-right mb-1">
                  <span
                    className={`text-[11px] font-mono ${
                      day.isToday
                        ? "text-flesh font-bold"
                        : "text-moon-dim"
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {day.events.slice(0, 3).map((event) => (
                    <CalendarEvent key={event.id} task={event} />
                  ))}
                  {day.events.length > 3 && (
                    <span className="text-[9px] text-moon-dim px-2">
                      +{day.events.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FeedRailScheduled />
    </div>
  );
}
