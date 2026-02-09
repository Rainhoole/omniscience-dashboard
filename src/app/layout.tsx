import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omniscience — Agent Dashboard",
  description: "AI Agent Management Center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
