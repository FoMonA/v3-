import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { config } from "./config";
import { sql } from "./db/client";
import { runMigrations } from "./db/migrate";
import { startIndexer, stopIndexer } from "./indexer/index";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import { addClient, removeClient } from "./ws/broadcast";

// Routes
import health from "./routes/health";
import proposals from "./routes/proposals";
import bets from "./routes/bets";
import agents from "./routes/agents";
import categories from "./routes/categories";
import stats from "./routes/stats";

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();

// Middleware
app.use("*", corsMiddleware);
app.use("*", errorHandler);

// Mount routes
app.route("/", health);
app.route("/", proposals);
app.route("/", bets);
app.route("/", agents);
app.route("/", categories);
app.route("/", stats);

// WebSocket
app.get(
  "/ws",
  upgradeWebSocket(() => ({
    onOpen(_event, ws) {
      addClient(ws);
      console.log("[ws] client connected");
    },
    onClose(_event, ws) {
      removeClient(ws);
      console.log("[ws] client disconnected");
    },
  })),
);

// Boot
async function boot() {
  console.log(`[foma] booting on ${config.network.name} (port ${config.port})`);
  await runMigrations();
  startIndexer();
}

boot().catch((err) => {
  console.error("[foma] boot failed:", err);
  process.exit(1);
});

// Graceful shutdown
function shutdown() {
  console.log("[foma] shutting down...");
  stopIndexer();
  sql.end().then(() => {
    console.log("[foma] db pool closed");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Export Bun server
export default {
  port: config.port,
  fetch: app.fetch,
  websocket,
};
