import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useSSE } from "../hooks/useSSE";

export default function Layout({ children }: { children: ReactNode }) {
  const { connected } = useSSE();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar connected={connected} />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        {children}
      </main>
    </div>
  );
}
