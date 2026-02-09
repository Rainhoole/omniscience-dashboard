"use client";

import { useEffect, useState, useCallback } from "react";
import { getBotColor } from "@/lib/bot-colors";
import TaskDetailModal from "@/components/task-detail-modal";
import VoidEmptyState from "@/components/void-empty-state";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "in_progress" | "pending_review" | "approved" | "archived" | "failed";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string | null;
  tags: string[] | null;
  reviewCount: number;
  firstTrySuccess: boolean | null;
  retroNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Bot {
  id: string;
  name: string;
  symbol: string;
  color: string;
}

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending_review", label: "Pending Review" },
  { key: "approved", label: "Approved" },
];

const PRIORITIES: Task["priority"][] = ["low", "medium", "high", "urgent"];

function NewTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [assignee, setAssignee] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [bots, setBots] = useState<Bot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then((data) => setBots(data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          assignee: assignee || null,
          tags: tags.length > 0 ? tags : null,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] border border-border-subtle bg-void-depth p-6 rounded-[4px]"
      >
        <h3 className="font-serif text-[18px] text-moon-bone mb-5">
          New Task
        </h3>

        <label className="block mb-3">
          <span className="text-[10px] uppercase tracking-widest text-moon-dim mb-1 block">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-void border border-border-subtle rounded-[4px] px-3 py-2 text-[13px] text-moon-bone font-mono outline-none focus:border-flesh-dim"
          />
        </label>

        <label className="block mb-3">
          <span className="text-[10px] uppercase tracking-widest text-moon-dim mb-1 block">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-void border border-border-subtle rounded-[4px] px-3 py-2 text-[13px] text-moon-bone font-mono outline-none resize-none focus:border-flesh-dim"
          />
        </label>

        <div className="flex gap-3 mb-3">
          <label className="flex-1">
            <span className="text-[10px] uppercase tracking-widest text-moon-dim mb-1 block">
              Priority
            </span>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as Task["priority"])
              }
              className="w-full bg-void border border-border-subtle rounded-[4px] px-3 py-2 text-[13px] text-moon-bone font-mono outline-none focus:border-flesh-dim"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex-1">
            <span className="text-[10px] uppercase tracking-widest text-moon-dim mb-1 block">
              Assignee
            </span>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-void border border-border-subtle rounded-[4px] px-3 py-2 text-[13px] text-moon-bone font-mono outline-none focus:border-flesh-dim"
            >
              <option value="">Unassigned</option>
              {bots.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.symbol} {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block mb-5">
          <span className="text-[10px] uppercase tracking-widest text-moon-dim mb-1 block">
            Tags (comma-separated)
          </span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="api, refactor, urgent"
            className="w-full bg-void border border-border-subtle rounded-[4px] px-3 py-2 text-[13px] text-moon-bone font-mono outline-none focus:border-flesh-dim"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-[6px] text-[11px] text-moon-dim border border-border-subtle rounded-[4px] hover:text-moon-bone transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-4 py-[6px] text-[11px] text-flesh border border-flesh-dim rounded-[4px] hover:bg-flesh-dark/30 transition-colors disabled:opacity-40"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TaskCard({
  task,
  onMutated,
  onClick,
}: {
  task: Task;
  onMutated: () => void;
  onClick: () => void;
}) {
  const [reviewing, setReviewing] = useState(false);

  const accentColor = task.assignee
    ? getBotColor(task.assignee)
    : "var(--color-moon-dim)";

  const isDone = task.status === "approved";
  const isReview = task.status === "pending_review";
  const isInProgress = task.status === "in_progress";

  async function handleReview(action: "approve" | "reject") {
    if (reviewing) return;
    setReviewing(true);
    try {
      await fetch(`/api/tasks/${task.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      onMutated();
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div
      onClick={onClick}
      className={`relative border border-border-subtle bg-void-depth rounded-[4px] p-4 cursor-pointer hover:border-moon-dim/40 transition-colors${
        isDone ? " opacity-60" : ""
      }`}
    >
      {/* Left accent bar */}
      <span
        className="absolute left-0 top-4 w-[2px] opacity-50 rounded-full"
        style={{
          height: "calc(100% - 32px)",
          backgroundColor: accentColor,
        }}
      />

      {/* Title */}
      <p
        className={`text-[13px] ml-2 leading-snug${
          isDone
            ? " line-through text-moon-dim"
            : " text-moon-bone"
        }`}
      >
        {task.title}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 ml-2 mt-2">
        {task.tags?.map((tag) => (
          <span
            key={tag}
            className="px-[6px] py-[2px] text-[10px] text-moon-dim border border-border-subtle rounded-[4px]"
          >
            {tag}
          </span>
        ))}

        <span className="text-[10px] text-moon-dim">{task.priority}</span>

        {task.assignee && (
          <span
            className="text-[10px] uppercase tracking-wider font-mono"
            style={{ color: accentColor }}
          >
            {task.assignee}
          </span>
        )}
      </div>

      {/* In-progress: progress bar */}
      {isInProgress && (
        <div className="mt-3 ml-2 h-[2px] rounded-full bg-[#222] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: "60%",
              backgroundColor: accentColor,
            }}
          />
        </div>
      )}

      {/* Review: action buttons */}
      {isReview && (
        <div className="flex gap-2 mt-3 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleReview("reject"); }}
            disabled={reviewing}
            className="px-2 py-1 text-[10px] text-moon-dim border border-border-subtle rounded-[4px] hover:text-moon-bone transition-colors disabled:opacity-40"
          >
            Reject
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleReview("approve"); }}
            disabled={reviewing}
            className="px-2 py-1 text-[10px] text-flesh border border-flesh-dim rounded-[4px] hover:bg-flesh-dark/30 transition-colors disabled:opacity-40"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

  const isEmpty = !loading && tasks.length === 0;

  return (
    <>
      {isEmpty ? (
        <VoidEmptyState onSummon={() => setShowNewTask(true)} />
      ) : (
        <div className="grid grid-cols-4 gap-6 px-8 py-6 min-h-0">
          {grouped.map((col) => (
            <div key={col.key} className="flex flex-col min-h-0">
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-widest text-moon-dim">
                    {col.label}
                  </span>
                  <span className="text-[11px] text-moon-dim">
                    {col.tasks.length}
                  </span>
                </div>

                {col.key === "draft" && (
                  <button
                    onClick={() => setShowNewTask(true)}
                    className="w-5 h-5 flex items-center justify-center text-[13px] text-moon-dim border border-border-subtle rounded-[4px] hover:text-moon-bone hover:border-moon-dim transition-colors"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                {loading && col.tasks.length === 0 && (
                  <span className="text-[11px] text-moon-dim">Loading…</span>
                )}
                {!loading && col.tasks.length === 0 && (
                  <span className="text-[11px] text-moon-dim italic">
                    No tasks
                  </span>
                )}
                {col.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMutated={fetchTasks}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewTask && (
        <NewTaskModal
          onClose={() => setShowNewTask(false)}
          onCreated={fetchTasks}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onMutated={fetchTasks}
        />
      )}
    </>
  );
}
