import type { ReactNode } from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(text: string): string {
  let safe = escapeHtml(text);
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return safe;
}

function isListLine(line: string): boolean {
  return /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
}

function isSpecialLine(line: string): boolean {
  return /^#{1,4}\s+/.test(line) || line.startsWith("```") || isListLine(line);
}

export default function MarkdownBlock({ content, className = "" }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index++;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index++;
      }
      index++;
      blocks.push(
        <pre key={`code-${blocks.length}`} className="markdown-pre">
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 4);
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      blocks.push(
        <Tag
          key={`heading-${blocks.length}`}
          className={`markdown-h${level}`}
          dangerouslySetInnerHTML={{ __html: formatInline(headingMatch[2]) }}
        />
      );
      index++;
      continue;
    }

    if (isListLine(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const items: string[] = [];
      while (index < lines.length && isListLine(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
        index++;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={`list-${blocks.length}`} className="markdown-list">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ListTag>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isSpecialLine(lines[index])) {
      paragraph.push(lines[index].trim());
      index++;
    }
    blocks.push(
      <p
        key={`paragraph-${blocks.length}`}
        className="markdown-p"
        dangerouslySetInnerHTML={{ __html: formatInline(paragraph.join(" ")) }}
      />
    );
  }

  return <div className={`markdown ${className}`.trim()}>{blocks}</div>;
}
