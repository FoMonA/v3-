import { Hono } from "hono";
import { sql } from "../db/client";
import { publicClient } from "../chain/clients";
import { config } from "../config";
import { getCheckpoint } from "../db/client";

const health = new Hono();

health.get("/health", async (c) => {
  let dbOk = false;
  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch {
    /* db down */
  }

  let blockNumber = 0n;
  try {
    blockNumber = await publicClient.getBlockNumber();
  } catch {
    /* rpc down */
  }

  let indexerBlock = 0n;
  try {
    indexerBlock = await getCheckpoint();
  } catch {
    /* no checkpoint yet */
  }

  const lag = Number(blockNumber - indexerBlock);

  return c.json({
    status: dbOk ? "ok" : "degraded",
    network: config.network.name,
    chainId: config.network.chainId,
    db: dbOk,
    blockNumber: blockNumber.toString(),
    indexerBlock: indexerBlock.toString(),
    indexerLag: lag,
    timestamp: new Date().toISOString(),
  });
});

export default health;
