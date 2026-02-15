import { createPublicClient, http, defineChain, type Address } from "viem";

// ─── Monad Chains ────────────────────────────────────────────────────────────

export const MONAD_MAINNET = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://monad.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://monadexplorer.com" },
  },
});

export const MONAD_TESTNET = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://monad-testnet.drpc.org"] },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
});

// ─── Network Toggle ──────────────────────────────────────────────────────────

export const IS_MAINNET = process.env.NETWORK !== "testnet";
export const CHAIN = IS_MAINNET ? MONAD_MAINNET : MONAD_TESTNET;

export const RPC_URL =
  process.env.RPC_URL ?? (IS_MAINNET ? "https://monad.drpc.org" : "https://monad-testnet.drpc.org");

// ─── FoMA Contracts ──────────────────────────────────────────────────────────

export const CONTRACTS = IS_MAINNET
  ? {
      FOMA: "0xA1F6152e4203F66349d0c0E53D9E50bA2A057777" as Address,
      REGISTRY: "0x6d3920cd0A1996a1c34FC238c9446B7e996eAE52" as Address,
      GOVERNOR: "0x144e0E78D8D29E79075e3640dcC391B0Da81eadB" as Address,
      POOL: "0x5C7ec54685cD57416FC4e1ba4deB12474D683a4E" as Address,
    }
  : {
      FOMA: "0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777" as Address,
      REGISTRY: "0x6782Ac490615F63BaAcED668A5fA4f4D3e250d6a" as Address,
      GOVERNOR: "0xb3EDdc787f22E188d3E30319df62cCb6f1bF4693" as Address,
      POOL: "0x8357034bF4A5B477709d90f3409C511F8Aa5Ec8C" as Address,
    };

export const API_URL =
  process.env.FOMA_API_URL ?? "http://u00swgokgkso0ssgssoog0c4.89.167.58.81.sslip.io";

export const CATEGORIES = ["Tech", "Trading", "Socials", "Meme", "NFT"] as const;

// ─── nad.fun Contracts ───────────────────────────────────────────────────────

export const NAD_FUN = IS_MAINNET
  ? {
      BONDING_CURVE_ROUTER: "0x865054F0F6A288adaAc30261731361EA7E908003" as Address,
      CURVE: "0x1228b0dc9481C11D3071E7A924B794CfB038994e" as Address,
      DEX_ROUTER: "0x5D4a4f430cA3B1b2dB86B9cFE48a5316800F5fb2" as Address,
      V3_FACTORY: "0xd0a37cf728CE2902eB8d4F6f2afc76854048253b" as Address,
      LENS: "0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea" as Address,
      WMON: "0x5a4E0bFDeF88C9032CB4d24338C5EB3d3870BfDd" as Address,
    }
  : {
      BONDING_CURVE_ROUTER: "0x865054F0F6A288adaAc30261731361EA7E908003" as Address,
      CURVE: "0x1228b0dc9481C11D3071E7A924B794CfB038994e" as Address,
      DEX_ROUTER: "0x5D4a4f430cA3B1b2dB86B9cFE48a5316800F5fb2" as Address,
      V3_FACTORY: "0xd0a37cf728CE2902eB8d4F6f2afc76854048253b" as Address,
      LENS: "0xB056d79CA5257589692699a46623F901a3BB76f1" as Address,
      WMON: "0x5a4E0bFDeF88C9032CB4d24338C5EB3d3870BfDd" as Address,
    };

// ─── ABIs ────────────────────────────────────────────────────────────────────

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

// nad.fun ABIs
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

// ─── Public Client ───────────────────────────────────────────────────────────

export function getPublicClient() {
  return createPublicClient({
    chain: CHAIN,
    transport: http(RPC_URL),
  });
}
