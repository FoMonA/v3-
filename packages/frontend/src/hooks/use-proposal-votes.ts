import { useReadContract } from "wagmi";
import { CONTRACTS, governorAbi } from "@/lib/contracts";

export function useProposalVotes(proposalId: bigint) {
  return useReadContract({
    address: CONTRACTS.GOVERNOR,
    abi: governorAbi,
    functionName: "proposalVotes",
    args: [proposalId],
    query: { enabled: proposalId > 0n },
  });
  // OZ GovernorCountingSimple returns: [againstVotes, forVotes, abstainVotes]
  // AGAINST is index 0, FOR is index 1
}
