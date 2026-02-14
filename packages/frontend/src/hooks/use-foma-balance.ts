import { useReadContract } from "wagmi";
import { CONTRACTS, fomaTokenAbi } from "@/lib/contracts";
import type { Address } from "viem";

export function useFomaBalance(address: Address | undefined) {
  return useReadContract({
    address: CONTRACTS.FOMA,
    abi: fomaTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
}
