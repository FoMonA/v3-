import { createPublicClient, http, defineChain } from "viem";

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

// ─── nad.fun Contracts (Mainnet only - Chain 143) ────────────────────────────

export const NAD_FUN = {
  BONDING_CURVE_ROUTER: "0x865054F0F6A288adaAc30261731361EA7E908003" as const,
  CURVE: "0x1228b0dc9481C11D3071E7A924B794CfB038994e" as const,
  DEX_ROUTER: "0x5D4a4f430cA3B1b2dB86B9cFE48a5316800F5fb2" as const,
  V3_FACTORY: "0xd0a37cf728CE2902eB8d4F6f2afc76854048253b" as const,
  LENS: "0xB056d79CA5257589692699a46623F901a3BB76f1" as const,
  WMON: "0x5a4E0bFDeF88C9032CB4d24338C5EB3d3870BfDd" as const,
  API_URL: "https://api.nad.fun",
} as const;

// ─── FoMA Contracts (populated after deployment) ─────────────────────────────

export const FOMA_CONTRACTS = {
  REGISTRY: "0x6d3920cd0A1996a1c34FC238c9446B7e996eAE52" as `0x${string}`,
  GOVERNOR: "0x144e0E78D8D29E79075e3640dcC391B0Da81eadB" as `0x${string}`,
  BETTING_POOL: "0x5C7ec54685cD57416FC4e1ba4deB12474D683a4E" as `0x${string}`,
  FOMA_TOKEN: "0xA1F6152e4203F66349d0c0E53D9E50bA2A057777" as `0x${string}`,
} as const;

// ─── Public Client ───────────────────────────────────────────────────────────

export function getPublicClient(chain = MONAD_MAINNET) {
  return createPublicClient({
    chain,
    transport: http(),
  });
}

// ─── ABIs (minimal — add full ABIs after contracts are compiled) ─────────────

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
