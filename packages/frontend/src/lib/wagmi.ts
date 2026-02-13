import { http, createConfig, type Transport } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import { ACTIVE_CHAIN } from "./constants";

export const monadChain = defineChain({
  id: ACTIVE_CHAIN.id,
  name: ACTIVE_CHAIN.name,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [ACTIVE_CHAIN.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: ACTIVE_CHAIN.explorer },
  },
});

export const wagmiConfig = createConfig({
  chains: [monadChain],
  connectors: [injected()],
  transports: {
    [monadChain.id]: http(),
  } as Record<typeof monadChain.id, Transport>,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
