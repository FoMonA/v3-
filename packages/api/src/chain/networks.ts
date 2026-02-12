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
    foma: "0x6609CC6181a7Cd300f7965B4CD7FA3ae95c74edf",
    registry: "0x05F407dA5C9473bcdD7489152A209c0ACB1Db1e7",
    governor: "0xcDC97caC210DE7D9422941595756b110C830226f",
    bettingPool: "0x085086891549979f76A462C8Db274d7da6CEb07c",
  },
  deployBlock: 12202115n,
};

const mainnet: NetworkConfig = {
  chainId: 143,
  name: "Monad",
  rpcRead: "https://monad.drpc.org",
  rpcWrite: "https://monad.drpc.org",
  explorer: "https://monadexplorer.com",
  contracts: {
    foma: (process.env.MAINNET_FOMA_ADDRESS ?? "0x0") as Address,
    registry: (process.env.MAINNET_REGISTRY_ADDRESS ?? "0x0") as Address,
    governor: (process.env.MAINNET_GOVERNOR_ADDRESS ?? "0x0") as Address,
    bettingPool: (process.env.MAINNET_BETTING_POOL_ADDRESS ?? "0x0") as Address,
  },
  deployBlock: BigInt(process.env.MAINNET_DEPLOY_BLOCK ?? "0"),
};

const networks: Record<string, NetworkConfig> = { testnet, mainnet };

export function getNetwork(name: "testnet" | "mainnet"): NetworkConfig {
  const net = networks[name];
  if (!net) throw new Error(`Unknown network: ${name}`);
  return net;
}
