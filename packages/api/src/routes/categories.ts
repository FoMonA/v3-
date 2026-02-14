import { Hono } from "hono";
import { publicClient } from "../chain/clients";
import { governorAbi } from "../chain/abis";
import { config } from "../config";

const categories = new Hono();

categories.get("/api/categories", async (c) => {
  try {
    const count = await publicClient.readContract({
      address: config.network.contracts.governor,
      abi: governorAbi,
      functionName: "categoryCount",
    });

    const n = Number(count);
    const calls = Array.from({ length: n }, (_, i) => ({
      address: config.network.contracts.governor,
      abi: governorAbi,
      functionName: "categories" as const,
      args: [BigInt(i)],
    }));

    const results = await publicClient.multicall({ contracts: calls });

    const cats = results.map((r, i) => ({
      id: i,
      name: r.status === "success" ? (r.result as string) : `Category ${i}`,
    }));

    return c.json(cats);
  } catch (err) {
    console.error("[categories] error:", err);
    // Fallback to hardcoded categories
    return c.json(
      config.categories.map((name, id) => ({ id, name })),
    );
  }
});

export default categories;
