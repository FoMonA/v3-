import React, { useState } from "react";
import { Box, Text } from "ink";
import { Select, TextInput } from "@inkjs/ui";

export type LlmProvider = "anthropic" | "openai" | "groq" | "openrouter";

export type ApiKeyData = {
  provider: LlmProvider;
  apiKey: string;
  envVar: string;
};

type Props = {
  onComplete: (data: ApiKeyData) => void;
};

const PROVIDERS: { label: string; value: LlmProvider; envVar: string; hint: string }[] = [
  {
    label: "Anthropic (Claude) — Recommended",
    value: "anthropic",
    envVar: "ANTHROPIC_API_KEY",
    hint: "sk-ant-...",
  },
  {
    label: "OpenAI (GPT)",
    value: "openai",
    envVar: "OPENAI_API_KEY",
    hint: "sk-...",
  },
  {
    label: "Groq",
    value: "groq",
    envVar: "GROQ_API_KEY",
    hint: "gsk_...",
  },
  {
    label: "OpenRouter",
    value: "openrouter",
    envVar: "OPENROUTER_API_KEY",
    hint: "sk-or-...",
  },
];

type Phase = "provider" | "key";

export function ApiKeySetup({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("provider");
  const [selected, setSelected] = useState<(typeof PROVIDERS)[number] | null>(null);

  const handleProvider = (value: string) => {
    const provider = PROVIDERS.find((p) => p.value === value)!;
    setSelected(provider);
    setPhase("key");
  };

  const handleKey = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || !selected) return;
    onComplete({
      provider: selected.value,
      apiKey: trimmed,
      envVar: selected.envVar,
    });
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>LLM Provider</Text>

      {phase === "provider" && (
        <Box flexDirection="column" gap={1}>
          <Text>Which AI provider should your agent use?</Text>
          <Select
            options={PROVIDERS.map((p) => ({ label: p.label, value: p.value }))}
            onChange={handleProvider}
          />
        </Box>
      )}

      {phase === "key" && selected && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Provider: {selected.label}</Text>
          <Text> </Text>
          <Text>Enter your {selected.label.split(" ")[0]} API key:</Text>
          <Text dimColor>Format: {selected.hint}</Text>
          <TextInput
            placeholder={selected.hint}
            onSubmit={handleKey}
          />
        </Box>
      )}
    </Box>
  );
}
