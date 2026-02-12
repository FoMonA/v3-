import { Hono } from "hono";
import { getStats } from "../db/client";

const stats = new Hono();

stats.get("/api/stats", async (c) => {
  const data = await getStats();
  return c.json(data);
});

export default stats;
