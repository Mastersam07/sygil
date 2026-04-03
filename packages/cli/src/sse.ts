import type { FastifyInstance } from "fastify";
import { fileEvents } from "./watcher.js";

export function registerSSE(app: FastifyInstance) {
  app.get("/api/events", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    reply.raw.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    const onChange = (data: { type: string; file: string }) => {
      reply.raw.write(`data: ${JSON.stringify({ event: "session_updated", file: data.file })}\n\n`);
    };

    fileEvents.on("change", onChange);

    const heartbeat = setInterval(() => {
      reply.raw.write(`: heartbeat\n\n`);
    }, 15000);

    req.raw.on("close", () => {
      fileEvents.off("change", onChange);
      clearInterval(heartbeat);
    });
  });
}
