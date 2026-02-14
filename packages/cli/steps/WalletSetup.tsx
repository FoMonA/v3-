import React, { useState } from "react";
import { Box, Text } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import {
  generateWallet,
  importWallet,
  isValidPrivateKey,
  generateUserId,
} from "../lib/helpers.js";

type WalletData = {
  address: string;
  privateKey: string;
  userId: string;
};

type Props = {
  onComplete: (data: WalletData) => void;
};

type Phase = "choose" | "generating" | "import" | "done";

export function WalletSetup({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChoice = (value: string) => {
    if (value === "generate") {
      setPhase("generating");
      setTimeout(() => {
        const { address, privateKey } = generateWallet();
        const userId = generateUserId(address);
        const data = { address, privateKey, userId };
        setWalletData(data);
        setPhase("done");
        setTimeout(() => onComplete(data), 1500);
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
    const userId = generateUserId(address);
    const data = { address, privateKey, userId };
    setWalletData(data);
    setPhase("done");
    setTimeout(() => onComplete(data), 1500);
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
          <TextInput
            placeholder="0x..."
            onSubmit={handleImport}
          />
          {error && <Text color="red">{error}</Text>}
        </Box>
      )}

      {phase === "done" && walletData && (
        <Box flexDirection="column">
          <Text color="green">✓ Wallet ready</Text>
          <Text dimColor>  Address: {walletData.address}</Text>
          <Text dimColor>  User ID: foma-{walletData.userId}</Text>
        </Box>
      )}
    </Box>
  );
}
