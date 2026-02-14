import type { Address } from "viem";

export type NetworkConfig = {
  chainId: number;
  name: string;
  rpcRead: string;
  rpcWrite: string;
  explorer: string;
  contracts: {
    foma: Address;
    registry: Address;
    governor: Address;
    bettingPool: Address;
  };
  deployBlock: bigint;
};

const testnet: NetworkConfig = {
  chainId: 10143,
  name: "Monad Testnet",
  rpcRead: "https://monad-testnet.drpc.org",
  rpcWrite: "https://testnet-rpc.monad.xyz",
  explorer: "https://testnet.monadexplorer.com",
  contracts: {
    foma: "0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777",
    registry: "0x6782Ac490615F63BaAcED668A5fA4f4D3e250d6a",
    governor: "0xb3EDdc787f22E188d3E30319df62cCb6f1bF4693",
    bettingPool: "0x8357034bF4A5B477709d90f3409C511F8Aa5Ec8C",
  },
  deployBlock: 12325482n,
};

const mainnet: NetworkConfig = {
  chainId: 143,
  name: "Monad",
  rpcRead: "https://monad.drpc.org",
  rpcWrite: "https://monad.drpc.org",
  explorer: "https://monadexplorer.com",
  contracts: {
    foma: "0xA1F6152e4203F66349d0c0E53D9E50bA2A057777",
    registry: "0x6d3920cd0A1996a1c34FC238c9446B7e996eAE52",
    governor: "0x144e0E78D8D29E79075e3640dcC391B0Da81eadB",
    bettingPool: "0x5C7ec54685cD57416FC4e1ba4deB12474D683a4E",
  },
  deployBlock: 55363959n,
};

const networks: Record<string, NetworkConfig> = { testnet, mainnet };

export function getNetwork(name: "testnet" | "mainnet"): NetworkConfig {
  const net = networks[name];
  if (!net) throw new Error(`Unknown network: ${name}`);
  return net;
}
