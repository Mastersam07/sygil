import { Inbox } from "lucide-react";

interface Props {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, message, icon }: Props) {
  return (
    <div className="card p-12 text-center">
      <div className="mb-3" style={{ color: "var(--text-muted)" }}>
        {icon || <Inbox size={24} />}
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{title}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}
