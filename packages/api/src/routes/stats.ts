import { Hono } from "hono";
import { getStats } from "../db/client";
import { publicClient } from "../chain/clients";
import { erc20Abi } from "../chain/abis";
import { config } from "../config";
import type { Stats } from "../types";

const stats = new Hono();

let cache: { data: Stats; ts: number } | null = null;

stats.get("/api/stats", async (c) => {
  const now = Date.now();
  if (cache && now - cache.ts < 30_000) {
    return c.json(cache.data);
  }

  const { contracts } = config.network;

  const [dbStats, totalPoolFoma, totalGovFoma] = await Promise.all([
    getStats(),
    publicClient.readContract({
      address: contracts.foma,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [contracts.bettingPool],
    }),
    publicClient.readContract({
      address: contracts.foma,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [contracts.governor],
    }),
  ]);

  const data: Stats = {
    ...dbStats,
    totalPoolFoma: totalPoolFoma.toString(),
    totalGovFoma: totalGovFoma.toString(),
  };

  cache = { data, ts: now };
  return c.json(data);
});

export default stats;
