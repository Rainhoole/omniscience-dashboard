"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-80">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-8 h-8 border border-moon-bone rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-moon-bone rounded-full" />
          </div>
          <h1 className="text-2xl tracking-wider font-serif">Omniscience</h1>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password..."
          className="bg-void-depth border border-border-subtle text-moon-dim px-4 py-3 text-xs rounded-full font-mono focus:outline-none focus:border-moon-dim transition-all"
        />
        {error && <p className="text-error text-xs text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-flesh-dark border border-flesh-dim text-flesh px-4 py-3 text-xs rounded-full cursor-pointer hover:bg-flesh-dim/20 transition-all disabled:opacity-50"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
