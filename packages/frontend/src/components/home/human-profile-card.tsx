import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { useFomaBalance } from "@/hooks/use-foma-balance";
import { useBuyFoma } from "@/hooks/use-buy-foma";
import { useSellFoma } from "@/hooks/use-sell-foma";
import { formatFoma } from "@/lib/format";
import { formatUnits } from "viem";
import { Wallet, Coins, Loader2 } from "lucide-react";
import { TofuIcon } from "@/assets/icons/tofu";
import { truncateAddress } from "@/lib/utils";

type TradeMode = "buy" | "sell";

export function HumanProfileCard() {
  const { address } = useAccount();
  const { data: rawFomaBalance } = useFomaBalance(address);
  const { data: monBalance } = useBalance({ address, query: { refetchInterval: 10_000 } });
  const { buyFoma, status: buyStatus, reset: resetBuy } = useBuyFoma();
  const { sellFoma, status: sellStatus, reset: resetSell } = useSellFoma();
  const [mode, setMode] = useState<TradeMode>("buy");
  const [input, setInput] = useState("");

  if (!address) return null;

  const fomaBalance =
    rawFomaBalance != null ? BigInt(rawFomaBalance as bigint) : undefined;

  const status = mode === "buy" ? buyStatus : sellStatus;
  const isBusy = status === "quoting" || status === "buying" || status === "approving" || status === "selling";

  const handleTrade = async () => {
    if (mode === "buy") {
      await buyFoma(input);
      resetBuy();
    } else {
      await sellFoma(input);
      resetSell();
    }
    setInput("");
  };

  const switchMode = (next: TradeMode) => {
    setMode(next);
    setInput("");
    resetBuy();
    resetSell();
  };

  const statusLabel = (() => {
    if (status === "quoting") return "Quoting...";
    if (status === "approving") return "Approving...";
    if (status === "buying") return "Buying...";
    if (status === "selling") return "Selling...";
    return mode === "buy" ? "Buy FOMA" : "Sell FOMA";
  })();

  return (
    <div className="glass-card space-y-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent">
          <TofuIcon className="size-6 text-white" />
        </div>
        <div>
          <div className="font-display text-base font-bold text-foreground">
            Your Wallet
          </div>
          <div className="font-mono text-sm text-foreground/40">
            {truncateAddress(address)}
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
          <div className="flex items-center gap-1 text-primary/60">
            <Coins className="size-3" />
            <span className="font-mono text-[9px] uppercase tracking-wider">
              FOMA
            </span>
          </div>
          <div className="mt-1 font-display text-lg font-bold text-primary">
            {fomaBalance !== undefined ? formatFoma(fomaBalance, 0) : "--"}
          </div>
        </div>
        <div className="rounded-lg border border-accent/15 bg-accent/5 p-3">
          <div className="flex items-center gap-1 text-accent/60">
            <Wallet className="size-3" />
            <span className="font-mono text-[9px] uppercase tracking-wider">
              MON
            </span>
          </div>
          <div className="mt-1 font-display text-lg font-bold text-accent">
            {monBalance
              ? parseFloat(formatUnits(monBalance.value, 18)).toFixed(2)
              : "--"}
          </div>
        </div>
      </div>

      {/* Trade FOMA */}
      <div className="space-y-2">
        {/* Buy / Sell toggle */}
        <div className="flex gap-1 rounded-lg border border-border/30 bg-background/30 p-0.5">
          <button
            onClick={() => switchMode("buy")}
            className={`flex-1 cursor-pointer rounded-md px-3 py-1 font-display text-xs font-bold transition-colors ${
              mode === "buy"
                ? "bg-chart-4/20 text-chart-4"
                : "text-foreground/40"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => switchMode("sell")}
            className={`flex-1 cursor-pointer rounded-md px-3 py-1 font-display text-xs font-bold transition-colors ${
              mode === "sell"
                ? "bg-accent/20 text-accent"
                : "text-foreground/40"
            }`}
          >
            Sell
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step={mode === "buy" ? "0.01" : "1"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary/50"
            placeholder={mode === "buy" ? "MON amount" : "FOMA amount"}
          />
          <button
            onClick={handleTrade}
            disabled={isBusy || !input}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-display text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "buy"
                ? "bg-chart-4 text-white"
                : "bg-accent text-white"
            }`}
          >
            {isBusy && <Loader2 className="size-3.5 animate-spin" />}
            {statusLabel}
          </button>
        </div>
        <p className="font-mono text-[10px] text-foreground/30">
          {mode === "buy" ? "Buy" : "Sell"}{" "}
          <a
            href="https://monadvision.com/token/0xA1F6152e4203F66349d0c0E53D9E50bA2A057777"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/50 underline"
          >
            $FOMA
          </a>{" "}
          on nad.fun
          {status === "confirmed" && (
            <span className="ml-1 text-chart-4"> -- Confirmed</span>
          )}
          {status === "error" && (
            <span className="ml-1 text-destructive"> -- Failed</span>
          )}
        </p>
      </div>
    </div>
  );
}
