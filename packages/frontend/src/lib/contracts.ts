import type { Address } from "viem";
import { parseAbi } from "viem";

// Deployed contract addresses (Monad Testnet 10143)
export const CONTRACTS = {
  FOMA: "0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777" as Address,
  REGISTRY: "0x6782Ac490615F63BaAcED668A5fA4f4D3e250d6a" as Address,
  GOVERNOR: "0xb3EDdc787f22E188d3E30319df62cCb6f1bF4693" as Address,
  POOL: "0x8357034bF4A5B477709d90f3409C511F8Aa5Ec8C" as Address,
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

// nad.fun contracts (testnet)
export const NAD_FUN = {
  LENS: "0xB056d79CA5257589692699a46623F901a3BB76f1" as Address,
} as const;

export const nadFunLensAbi = parseAbi([
  "function getAmountOut(address token, uint256 amountIn, bool isBuy) view returns (address router, uint256 amountOut)",
]);

export const nadFunRouterAbi = parseAbi([
  "function buy((uint256 amountOutMin, address token, address to, uint256 deadline)) payable",
  "function sell((uint256 amountIn, uint256 amountOutMin, address token, address to, uint256 deadline))",
]);
