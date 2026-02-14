import type { Address } from "viem";
import { parseAbi } from "viem";

// Deployed contract addresses (Monad Mainnet 143)
export const CONTRACTS = {
  FOMA: "0xA1F6152e4203F66349d0c0E53D9E50bA2A057777" as Address,
  REGISTRY: "0x6d3920cd0A1996a1c34FC238c9446B7e996eAE52" as Address,
  GOVERNOR: "0x144e0E78D8D29E79075e3640dcC391B0Da81eadB" as Address,
  POOL: "0x5C7ec54685cD57416FC4e1ba4deB12474D683a4E" as Address,
} as const;

// Parsed ABIs -- useReadContract requires parsed ABI objects, not human-readable strings.
// OZ GovernorCountingSimple.proposalVotes returns (againstVotes, forVotes, abstainVotes) - against is FIRST.

export const governorAbi = parseAbi([
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalCategories(uint256) view returns (uint256)",
  "function proposalCosts(uint256) view returns (uint256)",
  "function votingFees(uint256) view returns (uint256)",
  "function proposers(uint256) view returns (address)",
  "function categories(uint256) view returns (string)",
  "function categoryCount() view returns (uint256)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function clock() view returns (uint48)",
  "function votingPeriod() view returns (uint256)",
]);

export const bettingPoolAbi = parseAbi([
  "function markets(uint256) view returns (bool exists, bool resolved, bool outcome, uint256 totalYes, uint256 totalNo, uint256 platformFeeAmount)",
  "function yesBets(uint256, address) view returns (uint256)",
  "function noBets(uint256, address) view returns (uint256)",
  "function claimed(uint256, address) view returns (bool)",
  "function getClaimable(uint256 proposalId, address user) view returns (uint256)",
  "function MIN_BET() view returns (uint256)",
  "function bet(uint256 proposalId, bool yesOrNo, uint256 amount)",
  "function claim(uint256 proposalId)",
  "function resolve(uint256 proposalId)",
  "event BetPlaced(uint256 indexed proposalId, address indexed bettor, bool yesOrNo, uint256 amount)",
  "event MarketResolved(uint256 indexed proposalId, bool outcome, uint256 totalPool, uint256 platformFee)",
  "event Claimed(uint256 indexed proposalId, address indexed bettor, uint256 payout)",
]);

export const registryAbi = parseAbi([
  "function isRegistered(address agent) view returns (bool)",
  "function agentCount() view returns (uint256)",
  "event AgentRegistered(address indexed agent)",
]);

export const fomaTokenAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]);

// nad.fun contracts (mainnet)
export const NAD_FUN = {
  LENS: "0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea" as Address,
} as const;

export const nadFunLensAbi = parseAbi([
  "function getAmountOut(address token, uint256 amountIn, bool isBuy) view returns (address router, uint256 amountOut)",
]);

export const nadFunRouterAbi = parseAbi([
  "function buy((uint256 amountOutMin, address token, address to, uint256 deadline)) payable",
  "function sell((uint256 amountIn, uint256 amountOutMin, address token, address to, uint256 deadline))",
]);
