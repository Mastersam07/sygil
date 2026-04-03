import { readFileSync, existsSync } from "fs";

export function parseJsonlFile<T = unknown>(filePath: string): T[] {
  if (!existsSync(filePath)) return [];
  try {
    const content = readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line) as T; }
        catch { return null; }
      })
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}
