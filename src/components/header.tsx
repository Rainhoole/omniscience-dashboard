"use client";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
}

export function Header({ searchQuery, onSearchChange, onSearchSubmit }: HeaderProps) {
  return (
    <header
      className="col-span-full border-b border-border-subtle flex items-center px-6 justify-between z-10 backdrop-blur-sm"
      style={{ height: "60px", background: "rgba(3,3,3,0.8)" }}
    >
      <div className="flex items-center gap-3 text-xl tracking-wider text-moon-bone">
        <div className="w-6 h-6 border border-moon-bone rounded-full relative flex items-center justify-center">
          <div className="w-2 h-2 bg-moon-bone rounded-full" />
        </div>
        <span className="font-serif">Omniscience</span>
      </div>

      <div className="relative w-[400px]">
        <input
          type="text"
          className="w-full bg-void-depth border border-border-subtle text-moon-dim px-4 py-2 text-xs rounded-full font-mono transition-all duration-300 focus:outline-none focus:border-moon-dim"
          placeholder="Search memory, tasks, logs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit(searchQuery)}
        />
      </div>

      <div className="w-6 h-6 bg-flesh rounded-full opacity-80" />
    </header>
  );
}
