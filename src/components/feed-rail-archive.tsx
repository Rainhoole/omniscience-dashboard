"use client";

interface RecentFile {
  id: string;
  name: string;
  type: string;
  accessedAt: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  memory_nodes: "◆",
  system_logs: "▣",
  artifacts: "◎",
};

export function FeedRailArchive({
  recentFiles,
}: {
  recentFiles: RecentFile[];
}) {
  return (
    <div className="w-[280px] border-l border-border-subtle flex flex-col h-full bg-[rgba(0,0,0,0.15)]">
      <div className="px-5 pt-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <span className="font-serif text-base text-moon-bone">
            Recent Retrievals
          </span>
          <span className="text-[9px] tracking-[0.2em] uppercase text-flesh-dim font-mono">
            HISTORY
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {recentFiles.length === 0 && (
          <p className="text-[11px] text-moon-dim opacity-60">
            No files accessed yet.
          </p>
        )}

        <div className="flex flex-col gap-1">
          {recentFiles.map((file) => (
            <div key={file.id} className="relative pl-4 py-3 group">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border-subtle" />
              <div className="absolute left-[-2.5px] top-[18px] w-[6px] h-[6px] rounded-full bg-flesh-dim" />

              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-moon-dim font-mono">
                  {formatTime(file.accessedAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-flesh-dim">
                  {FILE_TYPE_ICONS[file.type] ?? "○"}
                </span>
                <p className="text-[11px] text-moon-bone leading-relaxed truncate">
                  {file.name}
                </p>
              </div>

              <span className="text-[9px] font-mono mt-1 inline-block text-moon-dim opacity-60">
                {file.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
