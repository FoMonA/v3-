import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config";

const monad = defineChain({
  id: config.network.chainId,
  name: config.network.name,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [config.network.rpcRead] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: config.network.explorer },
  },
});

export const publicClient = createPublicClient({
  chain: monad,
  transport: http(config.network.rpcRead),
});

export const deployerAccount = privateKeyToAccount(config.deployerPrivateKey);

export const walletClient = createWalletClient({
  chain: monad,
  transport: http(config.network.rpcWrite),
  account: deployerAccount,
});
