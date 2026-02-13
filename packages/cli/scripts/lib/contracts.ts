import { createPublicClient, http, defineChain, type Address } from "viem";
import { monadTestnet } from "viem/chains";

const monadMainnet = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "Monad Explorer", url: "https://monadexplorer.com" } },
});

export const IS_MAINNET = process.env.NETWORK === "mainnet";
export const CHAIN = IS_MAINNET ? monadMainnet : monadTestnet;

export const RPC_URL =
  process.env.RPC_URL ?? (IS_MAINNET ? "https://rpc.monad.xyz" : "https://monad-testnet.drpc.org");

export const CONTRACTS = {
  FOMA: (process.env.FOMA_ADDR ?? "0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777") as Address,
  REGISTRY: (process.env.REGISTRY_ADDR ?? "0x6782Ac490615F63BaAcED668A5fA4f4D3e250d6a") as Address,
  GOVERNOR: (process.env.GOVERNOR_ADDR ?? "0xb3EDdc787f22E188d3E30319df62cCb6f1bF4693") as Address,
  POOL: (process.env.POOL_ADDR ?? "0x8357034bF4A5B477709d90f3409C511F8Aa5Ec8C") as Address,
} as const;

export const API_URL =
  process.env.FOMA_API_URL ?? "https://api.fomadao.xyz";

export const CATEGORIES = ["Tech", "Trading", "Socials", "Meme", "NFT"] as const;

// Governor ABI
export const governorAbi = [
  {
    type: "function",
    name: "proposeWithCategory",
    stateMutability: "nonpayable",
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "description", type: "string" },
      { name: "categoryId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "castVote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "uint8" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "execute",
    stateMutability: "payable",
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "descriptionHash", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

// ERC20 ABI (approve + balanceOf)
export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Registry ABI
export const registryAbi = [
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// BettingPool ABI
export const bettingPoolAbi = [
  {
    type: "function",
    name: "resolve",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
] as const;

// nad.fun contracts (testnet + mainnet)
export const NAD_FUN = IS_MAINNET
  ? {
      LENS: "0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea" as Address,
    }
  : {
      LENS: "0xB056d79CA5257589692699a46623F901a3BB76f1" as Address,
    };

export const nadFunLensAbi = [
  {
    type: "function",
    name: "getAmountOut",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "isBuy", type: "bool" },
    ],
    outputs: [
      { name: "router", type: "address" },
      { name: "amountOut", type: "uint256" },
    ],
  },
] as const;

export const nadFunRouterAbi = [
  {
    type: "function",
    name: "buy",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "amountOutMin", type: "uint256" },
          { name: "token", type: "address" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "sell",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "token", type: "address" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [],
  },
] as const;

export function getPublicClient() {
  return createPublicClient({
    chain: CHAIN,
    transport: http(RPC_URL),
  });
}
