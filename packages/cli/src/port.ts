import { createServer } from "net";

export function findAvailablePort(preferred: number): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(preferred, "0.0.0.0", () => {
      server.close(() => resolve(preferred));
    });
    server.on("error", () => {
      const fallback = createServer();
      fallback.listen(0, "0.0.0.0", () => {
        const addr = fallback.address();
        const port = typeof addr === "object" && addr ? addr.port : 0;
        fallback.close(() => resolve(port));
      });
    });
  });
}
