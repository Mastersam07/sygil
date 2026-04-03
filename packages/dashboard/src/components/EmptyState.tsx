import { Inbox } from "lucide-react";

interface Props {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, message, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4" style={{ color: "var(--text-muted)" }}>
        {icon || <Inbox size={32} />}
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{title}</p>
      <p className="text-xs mt-1.5 max-w-xs" style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}
