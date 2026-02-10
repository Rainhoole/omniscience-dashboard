"use client";

import { useEffect, useState, useCallback } from "react";
import { FeedRailArchive } from "@/components/feed-rail-archive";

interface MemoryFile {
  id: string;
  name: string;
  content?: string;
  path: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

interface RecentFile {
  id: string;
  name: string;
  type: string;
  accessedAt: string;
}

interface TreeFolder {
  name: string;
  files: MemoryFile[];
  expanded: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isJsonContent(content: string): boolean {
  const trimmed = content.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function groupByType(files: MemoryFile[]): TreeFolder[] {
  const groups: Record<string, MemoryFile[]> = {};
  for (const file of files) {
    const key = file.type || "uncategorized";
    if (!groups[key]) groups[key] = [];
    groups[key].push(file);
  }

  const order = ["memory_nodes", "system_logs", "artifacts"];
  const sorted = Object.entries(groups).sort(([a], [b]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return sorted.map(([name, files]) => ({
    name,
    files,
    expanded: true,
  }));
}

function TreeNode({
  folder,
  selectedId,
  onToggle,
  onSelect,
}: {
  folder: TreeFolder;
  selectedId: string | null;
  onToggle: () => void;
  onSelect: (file: MemoryFile) => void;
}) {
  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left py-1 hover:opacity-100 transition-opacity"
      >
        <span className="text-[11px] text-moon-dim w-3">
          {folder.expanded ? "▾" : "▸"}
        </span>
        <span className="text-[11px] text-moon-bone opacity-80 font-mono tracking-wide">
          {folder.name}
        </span>
        <span className="text-[9px] text-moon-dim ml-auto">
          {folder.files.length}
        </span>
      </button>

      {folder.expanded && (
        <div className="ml-3 border-l border-border-subtle pl-3 mt-1">
          {folder.files.map((file) => {
            const isSelected = selectedId === file.id;
            return (
              <button
                key={file.id}
                onClick={() => onSelect(file)}
                className="flex items-center gap-2 w-full text-left py-1.5 hover:opacity-100 transition-opacity group"
              >
                <span
                  className={`text-[10px] ${
                    isSelected ? "text-flesh" : "text-moon-dim"
                  }`}
                >
                  {isSelected ? "●" : "○"}
                </span>
                <span
                  className={`text-[11px] truncate ${
                    isSelected
                      ? "text-moon-bone"
                      : "text-moon-dim group-hover:text-moon-bone"
                  }`}
                >
                  {file.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContentViewer({
  file,
  content,
  loading,
}: {
  file: MemoryFile | null;
  content: string | null;
  loading: boolean;
}) {
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[11px] text-moon-dim opacity-40 font-mono">
          Select a file to view its contents
        </p>
      </div>
    );
  }

  const handleExport = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-8 py-4 border-b border-border-subtle bg-void-depth flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-xl text-moon-bone">{file.name}</h3>
          <button
            onClick={handleExport}
            className="px-3 py-1 border border-border-subtle text-[10px] text-moon-dim hover:text-moon-bone hover:border-flesh-dim transition-colors font-mono tracking-wide"
          >
            EXPORT
          </button>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-moon-dim">
          <span>Type: {file.type}</span>
          <span>Created: {formatDate(file.createdAt)}</span>
          <span>Size: {formatSize(file.size)}</span>
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-[800px] mx-auto">
          {loading ? (
            <p className="text-[11px] text-moon-dim opacity-60 font-mono">
              Loading...
            </p>
          ) : content ? (
            isJsonContent(content) ? (
              <pre className="bg-void-depth border border-border-subtle rounded p-6 text-xs font-mono text-moon-dim overflow-x-auto whitespace-pre-wrap">
                {formatJson(content)}
              </pre>
            ) : (
              <div className="font-serif text-lg text-moon-bone leading-[1.8] whitespace-pre-wrap">
                {content}
              </div>
            )
          ) : (
            <p className="text-[11px] text-moon-dim opacity-60 font-mono">
              No content available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ArchiveView() {
  const [folders, setFolders] = useState<TreeFolder[]>([]);
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((data: MemoryFile[]) => {
        setFolders(groupByType(data));
      })
      .catch(() => {});
  }, []);

  const handleSelectFile = useCallback(
    (file: MemoryFile) => {
      setSelectedFile(file);
      setFileContent(null);
      setContentLoading(true);

      setRecentFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== file.id);
        return [
          {
            id: file.id,
            name: file.name,
            type: file.type,
            accessedAt: new Date().toISOString(),
          },
          ...filtered,
        ].slice(0, 20);
      });

      fetch(`/api/memory/${file.id}`)
        .then((r) => r.json())
        .then((data: MemoryFile) => {
          setFileContent(data.content ?? null);
        })
        .catch(() => {
          setFileContent(null);
        })
        .finally(() => {
          setContentLoading(false);
        });
    },
    []
  );

  const handleToggleFolder = useCallback((index: number) => {
    setFolders((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, expanded: !f.expanded } : f
      )
    );
  }, []);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="w-[240px] border-r border-border-subtle p-6 overflow-y-auto bg-[rgba(0,0,0,0.2)] flex-shrink-0">
        <h3 className="font-serif text-sm text-moon-dim mb-4 tracking-wide">
          Archive
        </h3>
        {folders.map((folder, idx) => (
          <TreeNode
            key={folder.name}
            folder={folder}
            selectedId={selectedFile?.id ?? null}
            onToggle={() => handleToggleFolder(idx)}
            onSelect={handleSelectFile}
          />
        ))}
        {folders.length === 0 && (
          <p className="text-[11px] text-moon-dim opacity-40">
            No files found.
          </p>
        )}
      </div>

      <ContentViewer
        file={selectedFile}
        content={fileContent}
        loading={contentLoading}
      />

      <FeedRailArchive recentFiles={recentFiles} />
    </div>
  );
}
