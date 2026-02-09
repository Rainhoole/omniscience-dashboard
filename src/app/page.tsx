"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { FeedRail } from "@/components/feed-rail";
import KanbanBoard from "@/components/kanban-board";
import { ChronologyView } from "@/components/chronology-view";
import { ArchiveView } from "@/components/archive-view";

type View = "Manifestation" | "Chronology" | "Archive";

const VIEWS: View[] = ["Manifestation", "Chronology", "Archive"];

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<View>("Manifestation");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultsProps["results"] | null>(null);
  const router = useRouter();

  const handleSearchSubmit = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (!q.trim()) setSearchResults(null);
  }, []);

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

      <main className="flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#111_0%,#030303_60%)]">
        <div className="px-8 py-5 flex gap-6 border-b border-border-subtle items-center">
          {VIEWS.map((view) => (
            <button
              key={view}
              className={`bg-transparent border-none text-lg cursor-pointer p-0 relative transition-colors duration-300 font-serif ${
                activeView === view ? "text-moon-bone" : "text-moon-dim"
              }`}
              onClick={() => {
                setActiveView(view);
                setSearchResults(null);
              }}
            >
              {view}
              {activeView === view && (
                <div
                  className="absolute bottom-[-21px] left-1/2 w-px h-5"
                  style={{
                    transform: "translateX(-50%)",
                    background:
                      "linear-gradient(to bottom, #E3DDD1, transparent)",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {searchResults ? (
          <SearchResults
            results={searchResults}
            onClose={() => {
              setSearchResults(null);
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {activeView === "Manifestation" && (
              <>
                <div className="flex-1 overflow-hidden">
                  <KanbanBoard />
                </div>
                <FeedRail />
              </>
            )}
            {activeView === "Chronology" && <ChronologyView />}
            {activeView === "Archive" && <ArchiveView />}
          </div>
        )}
      </main>
    </div>
  );
}

interface SearchResultsProps {
  results: {
    activities: Array<{ id: string; description: string; source: string; timestamp: string }>;
    tasks: Array<{ id: string; title: string; status: string; assignee: string | null }>;
    memoryFiles: Array<{ id: string; name: string; type: string; path: string }>;
  };
  onClose: () => void;
}

function SearchResults({ results, onClose }: SearchResultsProps) {
  const total =
    results.activities.length +
    results.tasks.length +
    results.memoryFiles.length;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-moon-bone">
          Search Results{" "}
          <span className="text-moon-dim text-sm font-mono">({total})</span>
        </h2>
        <button
          onClick={onClose}
          className="text-[10px] text-moon-dim border border-border-subtle px-3 py-1 hover:text-moon-bone hover:border-flesh-dim transition-colors font-mono"
        >
          Clear
        </button>
      </div>

      {results.tasks.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-sm text-moon-dim mb-3 italic">
            Tasks ({results.tasks.length})
          </h3>
          <div className="flex flex-col gap-2">
            {results.tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-void-depth border border-border-subtle rounded text-[12px]"
              >
                <span className="text-moon-bone">{task.title}</span>
                <span className="ml-3 text-[10px] text-moon-dim uppercase">
                  {task.status}
                </span>
                {task.assignee && (
                  <span className="ml-2 text-[10px] text-flesh opacity-70">
                    {task.assignee}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results.activities.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-sm text-moon-dim mb-3 italic">
            Activities ({results.activities.length})
          </h3>
          <div className="flex flex-col gap-2">
            {results.activities.map((a) => (
              <div
                key={a.id}
                className="p-3 bg-void-depth border border-border-subtle rounded text-[12px]"
              >
                <span className="text-moon-bone">{a.description}</span>
                <span className="ml-3 text-[10px] text-moon-dim">
                  {a.source}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.memoryFiles.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-sm text-moon-dim mb-3 italic">
            Memory Files ({results.memoryFiles.length})
          </h3>
          <div className="flex flex-col gap-2">
            {results.memoryFiles.map((f) => (
              <div
                key={f.id}
                className="p-3 bg-void-depth border border-border-subtle rounded text-[12px]"
              >
                <span className="text-moon-bone">{f.name}</span>
                <span className="ml-3 text-[10px] text-moon-dim">{f.type}</span>
                <span className="ml-2 text-[10px] text-moon-dim opacity-60">
                  {f.path}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="text-center text-moon-dim opacity-50 py-16 font-serif text-lg">
          No results found.
        </div>
      )}
    </div>
  );
}
