import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import { registerWithApi } from "../lib/helpers.js";

type Props = {
  address: string;
  privateKey: string;
  onComplete: () => void;
};

type State = "signing" | "registering" | "done";

export function Registration({ address, privateKey, onComplete }: Props) {
  const [state, setState] = useState<State>("signing");
  const [result, setResult] = useState<{
    status: "ok" | "exists" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const run = async () => {
      setState("registering");
      const res = await registerWithApi(address, privateKey);
      setResult(res);
      setState("done");
      setTimeout(onComplete, 2000);
    };
    run();
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Registering with FoMA backend...</Text>

      {state === "signing" && <Spinner label="Signing message..." />}
      {state === "registering" && <Spinner label="Registering agent..." />}

      {state === "done" && result && (
        <Box>
          {result.status === "ok" && (
            <Text color="green">✓ {result.message}</Text>
          )}
          {result.status === "exists" && (
            <Text dimColor>✓ {result.message}</Text>
          )}
          {result.status === "error" && (
            <Text color="yellow">⚠ {result.message}</Text>
          )}
        </Box>
      )}
    </Box>
  );
}
