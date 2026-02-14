import { formatUnits } from "viem";

/**
 * Format a bigint FOMA value (18 decimals) to a human-readable string.
 * 1000000000000000000n -> "1", 50500000000000000000n -> "50.50"
 */
export function formatFoma(value: bigint, decimals = 2): string {
  const formatted = formatUnits(value, 18);
  const num = parseFloat(formatted);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse a user-entered FOMA string to bigint (18 decimals).
 * Returns 0n if the input is invalid.
 */
export function parseFomaInput(value: string): bigint {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 0n;
  const [intPart = "0", decPart = ""] = value.split(".");
  const paddedDec = decPart.padEnd(18, "0").slice(0, 18);
  return BigInt(intPart) * 10n ** 18n + BigInt(paddedDec);
}

/**
 * Format a block deadline to a human-readable countdown.
 * Monad: ~500ms per block = 2 blocks/sec.
 */
export function formatCountdown(
  currentBlock: bigint,
  deadlineBlock: bigint,
): string {
  if (currentBlock >= deadlineBlock) return "Ended";
  const blocksLeft = deadlineBlock - currentBlock;
  const secondsLeft = Number(blocksLeft) / 2;
  if (secondsLeft < 60) return `${Math.ceil(secondsLeft)}s`;
  if (secondsLeft < 3600)
    return `${Math.floor(secondsLeft / 60)}m ${Math.ceil(secondsLeft % 60)}s`;
  const hours = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Calculate odds percentage for a betting market.
 * Returns 50/50 if no bets exist.
 */
export function calculateOdds(totalYes: bigint, totalNo: bigint) {
  const total = totalYes + totalNo;
  if (total === 0n) return { yesPercent: 50, noPercent: 50 };
  const yesPercent = Number((totalYes * 10000n) / total) / 100;
  const noPercent = 100 - yesPercent;
  return { yesPercent, noPercent };
}

/**
 * Format a number with unit suffixes (B, M, K).
 * 1500000 -> "1.5M", 7777 -> "7,777"
 */
export function formatValue(
  value: number,
  units = ["B", "M", "K"],
): string {
  const thresholds = { B: 1e9, M: 1e6, K: 1e5 };

  for (const symbol of units) {
    const threshold = thresholds[symbol as keyof typeof thresholds];
    if (value >= threshold) {
      const divisor = symbol === "K" ? 1e3 : threshold;
      const scaled = value / divisor;
      return scaled % 1 === 0
        ? `${scaled}${symbol}`
        : `${scaled.toFixed(1)}${symbol}`;
    }
  }

  return value.toLocaleString();
}
