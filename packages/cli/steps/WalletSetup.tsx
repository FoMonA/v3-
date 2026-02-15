import React, { useState } from "react";
import { Box, Text } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import {
  generateWallet,
  importWallet,
  isValidPrivateKey,
  generateUserId,
} from "../lib/helpers.js";

export type WalletData = {
  address: string;
  privateKey: string;
  userId: string;
  minFoma: number;
};

type Props = {
  onComplete: (data: WalletData) => void;
};

type Phase = "choose" | "generating" | "import" | "config" | "done";

export function WalletSetup({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [wallet, setWallet] = useState<{
    address: string;
    privateKey: string;
    userId: string;
  } | null>(null);
  const [minFoma, setMinFoma] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  const onWalletReady = (address: string, privateKey: string) => {
    const userId = generateUserId(address);
    setWallet({ address, privateKey, userId });
    setPhase("config");
  };

  const handleChoice = (value: string) => {
    if (value === "generate") {
      setPhase("generating");
      setTimeout(() => {
        const { address, privateKey } = generateWallet();
        onWalletReady(address, privateKey);
      }, 100);
    } else {
      setPhase("import");
    }
  };

  const handleImport = (value: string) => {
    const key = value.trim();
    if (!isValidPrivateKey(key)) {
      setError("Invalid private key (expected 64 hex chars, optionally 0x-prefixed)");
      return;
    }
    setError(null);
    const { address, privateKey } = importWallet(key);
    onWalletReady(address, privateKey);
  };

  const handleMinFoma = (value: string) => {
    const num = parseInt(value.trim(), 10);
    if (isNaN(num) || num < 0) {
      setError("Enter a valid number (e.g. 50)");
      return;
    }
    setError(null);
    setMinFoma(num);
    setPhase("done");
    setTimeout(() => {
      onComplete({
        address: wallet!.address,
        privateKey: wallet!.privateKey,
        userId: wallet!.userId,
        minFoma: num,
      });
    }, 1000);
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Wallet Setup</Text>

      {phase === "choose" && (
        <Box flexDirection="column" gap={1}>
          <Text>How would you like to set up your agent wallet?</Text>
          <Select
            options={[
              { label: "Generate a new wallet", value: "generate" },
              { label: "Import an existing private key", value: "import" },
            ]}
            onChange={handleChoice}
          />
        </Box>
      )}

      {phase === "generating" && <Spinner label="Generating new wallet..." />}

      {phase === "import" && (
        <Box flexDirection="column" gap={1}>
          <Text>Enter your private key (hex):</Text>
          <TextInput placeholder="0x..." onSubmit={handleImport} />
          {error && <Text color="red">{error}</Text>}
        </Box>
      )}

      {phase === "config" && wallet && (
        <Box flexDirection="column" gap={1}>
          <Text color="green">✓ Wallet ready</Text>
          <Text dimColor>  Address: {wallet.address}</Text>
          <Text dimColor>  User ID: foma-{wallet.userId}</Text>
          <Text> </Text>
          <Text>Minimum FOMA balance to maintain?</Text>
          <Text dimColor>
            Your agent auto-buys FOMA when below this threshold.
          </Text>
          <TextInput
            defaultValue="50"
            onSubmit={handleMinFoma}
          />
          {error && <Text color="red">{error}</Text>}
        </Box>
      )}

      {phase === "done" && wallet && (
        <Box flexDirection="column">
          <Text color="green">✓ Wallet ready</Text>
          <Text dimColor>  Address: {wallet.address}</Text>
          <Text dimColor>  User ID: foma-{wallet.userId}</Text>
          <Text dimColor>  Min FOMA: {minFoma}</Text>
        </Box>
      )}
    </Box>
  );
}
