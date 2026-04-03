import Fastify from "fastify";
import cors from "@fastify/cors";
import chalk from "chalk";
import { registerOverviewRoutes } from "./routes/overview.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerActivityRoutes } from "./routes/activity.js";
import { registerHistoryRoutes } from "./routes/history.js";
import { registerToolRoutes } from "./routes/tools.js";
import { registerChangeRoutes } from "./routes/changes.js";
import { registerExportRoutes } from "./routes/export.js";
import { registerSSE } from "./sse.js";
import { startWatcher } from "./watcher.js";

interface ServerOptions {
  port: number;
  claudeDir: string;
  open: boolean;
}

export async function startServer({ port, claudeDir, open }: ServerOptions) {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.decorate("claudeDir", claudeDir);

  registerOverviewRoutes(app, claudeDir);
  registerSessionRoutes(app, claudeDir);
  registerAnalyticsRoutes(app, claudeDir);
  registerProjectRoutes(app, claudeDir);
  registerActivityRoutes(app, claudeDir);
  registerHistoryRoutes(app, claudeDir);
  registerToolRoutes(app, claudeDir);
  registerChangeRoutes(app, claudeDir);
  registerExportRoutes(app, claudeDir);
  registerSSE(app);

  app.get("/api/health", async () => ({ status: "ok", claudeDir }));

  startWatcher(claudeDir);

  try {
    const { default: fastifyStatic } = await import("@fastify/static");
    const { join, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const { existsSync } = await import("fs");

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const dashboardPath = join(__dirname, "..", "..", "dashboard", "dist");

    if (existsSync(dashboardPath)) {
      await app.register(fastifyStatic, { root: dashboardPath, prefix: "/" });
      app.setNotFoundHandler((_, reply) => {
        reply.sendFile("index.html");
      });
    } else {
      app.get("/", async () => ({
        message: "Sygil API running. Dashboard not built yet — run 'pnpm build' in packages/dashboard or use 'pnpm dev' for dev mode.",
        api: "/api/health",
      }));
    }
  } catch {
    app.get("/", async () => ({ message: "Sygil API running.", api: "/api/health" }));
  }

  await app.listen({ port, host: "0.0.0.0" });
  console.log(chalk.dim(`  Dashboard → ${chalk.white.underline(`http://localhost:${port}`)}`));
  console.log();

  if (open) {
    try {
      const openMod = await import("open");
      await openMod.default(`http://localhost:${port}`);
    } catch { /* browser open failed, not critical */ }
  }
}
