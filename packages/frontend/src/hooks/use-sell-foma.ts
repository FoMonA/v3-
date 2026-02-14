import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useConfig } from "wagmi";
import { getWalletClient, switchChain } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import {
  formatUnits,
  encodeFunctionData,
  UserRejectedRequestError,
  type Address,
} from "viem";
import {
  CONTRACTS,
  NAD_FUN,
  fomaTokenAbi,
  nadFunLensAbi,
  nadFunRouterAbi,
} from "@/lib/contracts";
import { showToast } from "@/lib/toast";
import { formatFoma, parseFomaInput } from "@/lib/format";
import { monadChain } from "@/lib/wagmi";

type SellStatus =
  | "idle"
  | "quoting"
  | "approving"
  | "selling"
  | "confirmed"
  | "error";

export function useSellFoma() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const config = useConfig();
  const [status, setStatus] = useState<SellStatus>("idle");
  const queryClient = useQueryClient();

  const sellFoma = useCallback(
    async (fomaAmount: string) => {
      if (!address) {
        showToast("error", "Wallet not connected", "Connect your wallet first");
        return;
      }

      const parsed = parseFomaInput(fomaAmount);
      if (parsed <= 0n) {
        showToast("error", "Invalid amount", "Enter a positive FOMA amount");
        return;
      }

      try {
        setStatus("quoting");

        const [router, amountOut] = await publicClient!.readContract({
          address: NAD_FUN.LENS,
          abi: nadFunLensAbi,
          functionName: "getAmountOut",
          args: [CONTRACTS.FOMA, parsed, false],
        });

        // Check allowance and approve if needed
        const allowance = await publicClient!.readContract({
          address: CONTRACTS.FOMA,
          abi: fomaTokenAbi,
          functionName: "allowance",
          args: [address, router as Address],
        });

        await switchChain(config, { chainId: monadChain.id });
        const walletClient = await getWalletClient(config);

        if (allowance < parsed) {
          setStatus("approving");
          const approveHash = await walletClient.writeContract({
            chain: monadChain,
            address: CONTRACTS.FOMA,
            abi: fomaTokenAbi,
            functionName: "approve",
            args: [router as Address, parsed],
            gas: 100_000n,
          });
          await publicClient!.waitForTransactionReceipt({ hash: approveHash });
        }

        const amountOutMin = (amountOut * 90n) / 100n; // 10% slippage
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min

        setStatus("selling");

        const callData = encodeFunctionData({
          abi: nadFunRouterAbi,
          functionName: "sell",
          args: [
            {
              amountIn: parsed,
              amountOutMin,
              token: CONTRACTS.FOMA,
              to: address,
              deadline,
            },
          ],
        });

        const hash = await walletClient.sendTransaction({
          chain: monadChain,
          to: router as Address,
          data: callData,
          gas: 500_000n,
        });

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });
        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        setStatus("confirmed");
        await queryClient.invalidateQueries({ queryKey: ["readContract"] });
        const monReceived = parseFloat(formatUnits(amountOutMin, 18)).toFixed(
          4,
        );
        showToast(
          "success",
          "FOMA sold",
          `Sold ${formatFoma(parsed)} FOMA for ~${monReceived} MON`,
        );
      } catch (error: unknown) {
        if (
          error instanceof UserRejectedRequestError ||
          (error instanceof Error && error.message.includes("User rejected"))
        ) {
          setStatus("idle");
          showToast(
            "warning",
            "Transaction cancelled",
            "You rejected the transaction",
          );
          return;
        }
        console.error("Sell failed:", error);
        setStatus("error");
        const msg =
          error instanceof Error
            ? error.message.slice(0, 100)
            : "Unknown error";
        showToast("error", "Sell failed", msg);
      }
    },
    [address, publicClient, config, queryClient],
  );

  const reset = useCallback(() => setStatus("idle"), []);

  return { sellFoma, status, reset };
}
