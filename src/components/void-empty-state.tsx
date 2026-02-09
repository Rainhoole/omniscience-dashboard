"use client";

export default function VoidEmptyState({
  onSummon,
}: {
  onSummon: () => void;
}) {
  return (
    <>
      <style>{`
        @keyframes void-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.04); }
        }
        @keyframes void-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(196, 164, 150, 0.15); }
          50% { box-shadow: 0 0 24px rgba(196, 164, 150, 0.35); }
        }
      `}</style>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 select-none">
        {/* Sigil */}
        <div className="relative flex items-center justify-center">
          {/* Outer circle */}
          <div
            className="absolute rounded-full border border-moon-dim"
            style={{
              width: 120,
              height: 120,
              animation: "void-pulse 4s ease-in-out infinite",
            }}
          />
          {/* Middle circle */}
          <div
            className="absolute rounded-full border border-flesh"
            style={{
              width: 80,
              height: 80,
              animation: "void-pulse 4s ease-in-out infinite 1s",
            }}
          />
          {/* Inner eye */}
          <div
            className="relative rounded-full border border-flesh flex items-center justify-center"
            style={{ width: 24, height: 24 }}
          >
            <div
              className="rounded-full bg-flesh"
              style={{ width: 8, height: 8 }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <h2 className="font-serif text-2xl text-moon-bone m-0">
            The Void Awaits
          </h2>
          <p className="font-mono text-[12px] text-moon-dim m-0">
            No active manifestations. Summon a task to begin.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onSummon}
          className="px-6 py-[10px] text-[12px] font-mono text-flesh border border-flesh-dim rounded-[4px] bg-transparent cursor-pointer hover:bg-flesh-dark/30 transition-colors"
          style={{ animation: "void-glow 3s ease-in-out infinite" }}
        >
          Summon Task
        </button>
      </div>
    </>
  );
}
