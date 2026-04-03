interface Props {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>{title}</p>
      <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}
