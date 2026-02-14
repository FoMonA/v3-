import { config } from "../config";
import { publicClient } from "../chain/clients";
import { governorAbi, bettingPoolAbi, registryAbi } from "../chain/abis";
import { getCheckpoint, setCheckpoint } from "../db/client";
import { handleLog } from "./handlers";
import { broadcast } from "../ws/broadcast";
import type { Log } from "viem";

let running = false;

export function startIndexer() {
  running = true;
  console.log(
    `[indexer] started on ${config.network.name} (chain ${config.network.chainId})`,
  );
  loop();
}

export function stopIndexer() {
  running = false;
  console.log("[indexer] stopping");
}

async function loop() {
  while (running) {
    try {
      const moreWork = await poll();
      if (!moreWork) {
        await sleep(config.pollIntervalMs);
      }
    } catch (err) {
      console.error("[indexer] poll error:", err);
      await sleep(config.pollIntervalMs);
    }
  }
}

async function poll(): Promise<boolean> {
  const checkpoint = await getCheckpoint();
  const rawLatest = await publicClient.getBlockNumber();
  // Safety buffer: dRPC reports blocks before they're available for getLogs
  const latestBlock = rawLatest - 10n;

  const fromBlock = checkpoint + 1n;
  if (fromBlock > latestBlock) return false;

  const toBlock =
    fromBlock + config.chunkSize - 1n > latestBlock
      ? latestBlock
      : fromBlock + config.chunkSize - 1n;

  const { governor, bettingPool, registry } = config.network.contracts;

  // Fetch logs from all 3 contracts in parallel
  const [governorLogs, bettingLogs, registryLogs] = await Promise.all([
    publicClient.getLogs({
      address: governor,
      fromBlock,
      toBlock,
      events: governorAbi.filter((e) => e.type === "event") as any,
    }),
    publicClient.getLogs({
      address: bettingPool,
      fromBlock,
      toBlock,
      events: bettingPoolAbi.filter((e) => e.type === "event") as any,
    }),
    publicClient.getLogs({
      address: registry,
      fromBlock,
      toBlock,
      events: registryAbi.filter((e) => e.type === "event") as any,
    }),
  ]);

  // Merge and sort by (blockNumber, logIndex)
  const allLogs: Log[] = [
    ...(governorLogs as Log[]),
    ...(bettingLogs as Log[]),
    ...(registryLogs as Log[]),
  ].sort((a, b) => {
    const blockDiff = Number(a.blockNumber!) - Number(b.blockNumber!);
    if (blockDiff !== 0) return blockDiff;
    return Number(a.logIndex!) - Number(b.logIndex!);
  });

  // Process each log
  for (const log of allLogs) {
    const event = await handleLog(log);
    if (event) {
      broadcast(event);
    }
  }

  await setCheckpoint(toBlock);

  const blocksIndexed = Number(toBlock - fromBlock + 1n);
  if (allLogs.length > 0) {
    console.log(
      `[indexer] blocks ${fromBlock}..${toBlock} (${blocksIndexed} blocks, ${allLogs.length} events)`,
    );
  }

  // Return true if there's more to catch up on
  return toBlock < latestBlock;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
