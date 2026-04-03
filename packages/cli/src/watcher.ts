import { watch } from "fs";
import { join } from "path";
import { EventEmitter } from "events";
import { existsSync } from "fs";

export const fileEvents = new EventEmitter();
fileEvents.setMaxListeners(50);

export function startWatcher(claudeDir: string) {
  const projectsDir = join(claudeDir, "projects");
  if (!existsSync(projectsDir)) return;

  try {
    watch(projectsDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.endsWith(".jsonl") && !filename.endsWith(".wakatime")) {
        fileEvents.emit("change", { type: eventType, file: filename });
      }
    });
  } catch {
    // fs.watch with recursive not supported on all platforms — silent fallback
  }
}
