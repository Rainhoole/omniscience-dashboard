"use client";

import { useEffect, useState } from "react";
import { getBotColor } from "@/lib/bot-colors";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  objective: string | null;
  status: "draft" | "in_progress" | "pending_review" | "approved" | "archived" | "failed";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface DialogueEntry {
  id: string;
  speaker: string;
  message: string;
  timestamp: string;
}

interface Version {
  id: string;
  version: number;
  artifactSize: number | null;
  createdAt: string;
  isLatest: boolean;
}

interface Resource {
  id: string;
  filename: string;
  fileType: string;
  url: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  in_progress: "var(--color-flesh)",
  pending_review: "var(--color-bot-beta)",
  approved: "var(--color-success)",
  archived: "var(--color-moon-dim)",
  failed: "var(--color-error)",
  draft: "var(--color-moon-dim)",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "var(--color-moon-dim)";
  return (
    <span
      className="px-[6px] py-[2px] text-[10px] uppercase tracking-wider rounded-[4px] border"
      style={{ color, borderColor: color }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function fileTypeIcon(fileType: string): string {
  const map: Record<string, string> = {
    ts: "◇",
    tsx: "◇",
    js: "◇",
    jsx: "◇",
    json: "{}",
    css: "◈",
    md: "¶",
    png: "◻",
    jpg: "◻",
    svg: "◻",
    txt: "≡",
  };
  return map[fileType.toLowerCase()] ?? "·";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TaskDetailModal({
  taskId,
  onClose,
  onMutated,
}: {
  taskId: string;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [dialogue, setDialogue] = useState<DialogueEntry[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tasks/${taskId}`).then((r) => r.json()),
      fetch(`/api/tasks/${taskId}/dialogue`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`/api/tasks/${taskId}/versions`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`/api/tasks/${taskId}/resources`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([taskData, dialogueData, versionsData, resourcesData]) => {
        setTask(taskData);
        setDialogue(dialogueData);
        setVersions(versionsData);
        setResources(resourcesData);
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  async function handleAction(endpoint: string) {
    if (acting) return;
    setActing(true);
    try {
      await fetch(`/api/tasks/${taskId}/${endpoint}`, { method: "POST" });
      onMutated();
      onClose();
    } finally {
      setActing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[900px] max-h-[85vh] flex flex-col border border-border-subtle bg-void-depth rounded-[4px] overflow-hidden"
      >
        {loading || !task ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-[11px] text-moon-dim">Loading…</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-border-subtle px-6 py-5 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-[22px] text-moon-bone leading-tight truncate">
                    {task.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-[6px] py-[1px] text-[10px] text-moon-dim border border-border-subtle rounded-[4px] font-mono">
                      {task.id.slice(0, 8)}
                    </span>
                    {task.assignee && (
                      <span
                        className="text-[11px] uppercase tracking-wider font-mono"
                        style={{ color: getBotColor(task.assignee) }}
                      >
                        {task.assignee}
                      </span>
                    )}
                    <StatusBadge status={task.status} />
                    <span className="text-[10px] text-moon-dim">
                      {formatTime(task.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-moon-dim hover:text-moon-bone transition-colors text-[18px] leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left column (2/3) */}
              <div className="flex-[2] border-r border-border-subtle overflow-y-auto p-6">
                {/* Objective / Description */}
                <section className="mb-6">
                  <h3 className="text-[10px] uppercase tracking-widest text-moon-dim mb-3">
                    Objective Description
                  </h3>
                  <p className="text-[13px] text-moon-bone leading-relaxed whitespace-pre-wrap">
                    {task.objective || task.description || "No description provided."}
                  </p>
                </section>

                {/* Dialogue */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-moon-dim mb-3">
                    Internal Agent Dialogue
                  </h3>
                  {dialogue.length === 0 ? (
                    <p className="text-[11px] text-moon-dim italic">No dialogue recorded.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {dialogue.map((entry) => {
                        const speakerColor = getBotColor(entry.speaker);
                        return (
                          <div key={entry.id} className="flex gap-3">
                            <div
                              className="w-[2px] shrink-0 rounded-full"
                              style={{ backgroundColor: speakerColor }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[10px] uppercase tracking-wider font-mono"
                                  style={{ color: speakerColor }}
                                >
                                  {entry.speaker}
                                </span>
                                <span className="text-[10px] text-moon-dim">
                                  {formatTime(entry.timestamp)}
                                </span>
                              </div>
                              <p className="text-[12px] text-moon-bone leading-relaxed whitespace-pre-wrap">
                                {entry.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Right column (1/3) */}
              <div className="flex-[1] overflow-y-auto p-6">
                {/* Versions */}
                <section className="mb-6">
                  <h3 className="text-[10px] uppercase tracking-widest text-moon-dim mb-3">
                    Versions
                  </h3>
                  {versions.length === 0 ? (
                    <p className="text-[11px] text-moon-dim italic">No versions.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {versions.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between border border-border-subtle rounded-[4px] px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-moon-bone font-mono">
                              V{v.version}
                            </span>
                            {v.isLatest && (
                              <span className="px-[5px] py-[1px] text-[9px] text-flesh border border-flesh-dim rounded-[4px]">
                                latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {v.artifactSize != null && (
                              <span className="text-[10px] text-moon-dim">
                                {formatBytes(v.artifactSize)}
                              </span>
                            )}
                            <span className="text-[10px] text-moon-dim">
                              {formatTime(v.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Resources */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-widest text-moon-dim mb-3">
                    Resources
                  </h3>
                  {resources.length === 0 ? (
                    <p className="text-[11px] text-moon-dim italic">No resources.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {resources.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 border border-border-subtle rounded-[4px] px-3 py-2"
                        >
                          <span className="text-[12px] text-moon-dim">
                            {fileTypeIcon(r.fileType)}
                          </span>
                          <span className="text-[12px] text-moon-bone truncate">
                            {r.filename}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle px-6 py-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => handleAction("revision")}
                disabled={acting}
                className="px-4 py-[6px] text-[11px] text-moon-dim border border-border-subtle rounded-[4px] hover:text-moon-bone transition-colors disabled:opacity-40"
              >
                Request Revision
              </button>
              <button
                onClick={() => handleAction("archive")}
                disabled={acting}
                className="px-4 py-[6px] text-[11px] text-moon-dim border border-border-subtle rounded-[4px] hover:text-moon-bone transition-colors disabled:opacity-40"
              >
                Archive
              </button>
              <button
                onClick={() => handleAction("approve")}
                disabled={acting}
                className="px-4 py-[6px] text-[11px] text-flesh border border-flesh-dim rounded-[4px] hover:bg-flesh-dark/30 transition-colors disabled:opacity-40"
              >
                Approve Manifestation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
