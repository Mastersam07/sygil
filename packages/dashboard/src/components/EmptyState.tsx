import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface Props {
  title: string;
  message: string;
  icon?: ReactNode;
}

export default function EmptyState({ title, message, icon }: Props) {
  return (
    <div className="card p-10 md:p-14 text-center">
      <div
        className="w-16 h-16 mx-auto mb-5 rounded-[20px] flex items-center justify-center"
        style={{ background: "rgba(255, 255, 255, 0.04)", color: "var(--text-muted)" }}
      >
        {icon || <Inbox size={30} />}
      </div>
      <p className="text-lg font-semibold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-sm mt-2 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}
