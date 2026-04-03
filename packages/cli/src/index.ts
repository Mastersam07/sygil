import { Command } from "commander";
import { detectClaudeDir } from "@sygil/core";
import { printStartup } from "./startup.js";
import { startServer } from "./server.js";
import { findAvailablePort } from "./port.js";

const program = new Command();

program
  .name("sygil")
  .description("Your System for Claude Code")
  .version("0.1.0");

program
  .command("dashboard", { isDefault: true })
  .description("Launch browser dashboard")
  .option("-p, --port <number>", "Port for dashboard server", "4321")
  .option("-d, --dir <path>", "Path to Claude data directory")
  .option("--no-open", "Don't auto-open browser")
  .action(async (opts) => {
    const claudeDir = detectClaudeDir(opts.dir);
    if (!claudeDir) {
      console.error("Could not find Claude Code data directory. Use --dir to specify.");
      process.exit(1);
    }
    const preferred = parseInt(opts.port, 10);
    const port = await findAvailablePort(preferred);
    await printStartup(claudeDir);
    await startServer({ port, claudeDir, open: opts.open !== false });
  });

program
  .command("stats")
  .description("Print overview stats as JSON")
  .option("-d, --dir <path>", "Path to Claude data directory")
  .action(async (opts) => {
    const { loadAllSessions } = await import("@sygil/core");
    const claudeDir = detectClaudeDir(opts.dir);
    if (!claudeDir) { console.error("Could not find Claude Code data."); process.exit(1); }
    const sessions = loadAllSessions(claudeDir);
    const totalTokens = sessions.reduce((a, s) => ({
      input: a.input + s.tokens.input, output: a.output + s.tokens.output,
      cacheCreation: a.cacheCreation + s.tokens.cacheCreation, cacheRead: a.cacheRead + s.tokens.cacheRead,
    }), { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 });
    const totalCost = sessions.reduce((a, s) => a + s.cost, 0);
    console.log(JSON.stringify({ sessions: sessions.length, totalTokens, estimatedCost: Math.round(totalCost * 100) / 100 }, null, 2));
  });

program.parse();
