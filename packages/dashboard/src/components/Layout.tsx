import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useSSE } from "../hooks/useSSE";

export default function Layout({ children }: { children: ReactNode }) {
  const { connected } = useSSE();

  return (
    <div className="shell">
      <Sidebar connected={connected} />
      <div className="shell-main">
        <div className="shell-content">
          {children}
        </div>
      </div>
    </div>
  );
}
