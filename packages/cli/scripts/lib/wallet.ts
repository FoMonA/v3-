import { createWalletClient, http, type WalletClient, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { MONAD_MAINNET } from "./contracts.js";

/**
 * Load the agent wallet from environment variables.
 * OpenClaw automatically loads .env from the workspace directory into process.env.
 */
export function getPrivateKey(): `0x${string}` {
  const key = process.env.MONAD_MAINNET_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "MONAD_MAINNET_PRIVATE_KEY not found in environment. " +
        "Make sure your .env file exists in your OpenClaw workspace."
    );
  }
  return key as `0x${string}`;
}

export function getAddress(): string {
  const address = process.env.MONAD_MAINNET_ADDRESS;
  if (!address) {
    throw new Error(
      "MONAD_MAINNET_ADDRESS not found in environment. " +
        "Make sure your .env file exists in your OpenClaw workspace."
    );
  }
  return address;
}

export function getAccount() {
  return privateKeyToAccount(getPrivateKey());
}

export function getWalletClient(chain: Chain = MONAD_MAINNET): WalletClient {
  const account = getAccount();
  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
}
