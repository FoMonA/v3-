import { Hono } from "hono";
import { verifyMessage, type Address } from "viem";
import { getAgents, insertAgent } from "../db/client";
import { publicClient, walletClient } from "../chain/clients";
import { registryAbi } from "../chain/abis";
import { config } from "../config";

const agents = new Hono();

agents.get("/api/agents", async (c) => {
  const rows = await getAgents();
  return c.json(rows.map((a) => ({ address: a.address })));
});

agents.post("/api/agents/register", async (c) => {
  const body = await c.req.json<{
    address: string;
    signature: string;
    message: string;
  }>();

  const { address, signature, message } = body;

  if (!address || !signature || !message) {
    return c.json({ error: "address, signature, and message required" }, 400);
  }

  // Validate message format: "Register agent 0x... for FoMA at timestamp N"
  const msgRegex =
    /^Register agent (0x[a-fA-F0-9]{40}) for FoMA at timestamp (\d+)$/;
  const match = message.match(msgRegex);
  if (!match) {
    return c.json({ error: "Invalid message format" }, 400);
  }

  const msgAddress = match[1];
  const timestamp = parseInt(match[2], 10);

  if (msgAddress.toLowerCase() !== address.toLowerCase()) {
    return c.json({ error: "Address mismatch in message" }, 400);
  }

  // Validate timestamp freshness (5 min window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return c.json({ error: "Signature expired (>5 min)" }, 400);
  }

  // Verify EIP-191 signature
  try {
    const valid = await verifyMessage({
      address: address as Address,
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return c.json({ error: "Invalid signature" }, 401);
    }
  } catch {
    return c.json({ error: "Signature verification failed" }, 401);
  }

  // Check if already registered on-chain
  try {
    const isRegistered = await publicClient.readContract({
      address: config.network.contracts.registry,
      abi: registryAbi,
      functionName: "isRegistered",
      args: [address as Address],
    });
    if (isRegistered) {
      return c.json({ error: "Agent already registered" }, 409);
    }
  } catch (err) {
    console.error("[agents/register] isRegistered check failed:", err);
    return c.json({ error: "Failed to check registration status" }, 500);
  }

  // Call Registry.registerAgent() on-chain
  try {
    const txHash = await walletClient.writeContract({
      address: config.network.contracts.registry,
      abi: registryAbi,
      functionName: "registerAgent",
      args: [address as Address],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // Insert into DB
    await insertAgent({
      address,
      blockNumber: Number(receipt.blockNumber),
      txHash,
    });

    return c.json({
      success: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
    });
  } catch (err) {
    console.error("[agents/register] on-chain registration failed:", err);
    return c.json({ error: "On-chain registration failed" }, 500);
  }
});

export default agents;
