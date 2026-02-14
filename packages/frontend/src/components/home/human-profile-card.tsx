import { useAccount, useBalance } from "wagmi";
import { useFomaBalance } from "@/hooks/use-foma-balance";
import { formatFoma } from "@/lib/format";
import { formatUnits } from "viem";
import { Wallet, Coins } from "lucide-react";
import { TofuIcon } from "@/assets/icons/tofu";
import { truncateAddress } from "@/lib/utils";

export function HumanProfileCard() {
  const { address } = useAccount();
  const { data: rawFomaBalance } = useFomaBalance(address);
  const { data: monBalance } = useBalance({ address, query: { refetchInterval: 10_000 } });

  if (!address) return null;

  const fomaBalance =
    rawFomaBalance != null ? BigInt(rawFomaBalance as bigint) : undefined;

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
    </div>
  );
}
