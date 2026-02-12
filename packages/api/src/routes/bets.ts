import { Hono } from "hono";
import { getBets, getClaimableBets } from "../db/client";

const bets = new Hono();

bets.get("/api/bets/claimable", async (c) => {
  const user = c.req.query("user");
  if (!user) return c.json({ error: "user query param required" }, 400);

  const claimable = await getClaimableBets(user);
  return c.json(claimable);
});

bets.get("/api/bets", async (c) => {
  const user = c.req.query("user");
  const proposalId = c.req.query("proposalId");

  const rows = await getBets({ user: user ?? undefined, proposalId: proposalId ?? undefined });
  return c.json(rows);
});

export default bets;
