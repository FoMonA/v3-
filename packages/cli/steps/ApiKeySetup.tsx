import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import { getExistingApiKey } from "../lib/helpers.js";

export type LlmProvider = "anthropic" | "openai" | "gemini" | "groq" | "openrouter";

export type ApiKeyData = {
  provider: LlmProvider;
  apiKey: string;
  envVar: string;
  model: string;
};

type Props = {
  onComplete: (data: ApiKeyData) => void;
};

export const PROVIDERS: {
  label: string;
  value: LlmProvider;
  envVar: string;
  hint: string;
  model: string;
}[] = [
  {
    label: "Anthropic (Claude) — Recommended",
    value: "anthropic",
    envVar: "ANTHROPIC_API_KEY",
    hint: "sk-ant-...",
    model: "anthropic/claude-sonnet-4-5-20250929",
  },
  {
    label: "OpenAI (GPT)",
    value: "openai",
    envVar: "OPENAI_API_KEY",
    hint: "sk-...",
    model: "openai/gpt-4o",
  },
  {
    label: "Google (Gemini)",
    value: "gemini",
    envVar: "GEMINI_API_KEY",
    hint: "AIza...",
    model: "google/gemini-2.5-pro",
  },
  {
    label: "Groq",
    value: "groq",
    envVar: "GROQ_API_KEY",
    hint: "gsk_...",
    model: "groq/llama-3.3-70b-versatile",
  },
  {
    label: "OpenRouter",
    value: "openrouter",
    envVar: "OPENROUTER_API_KEY",
    hint: "sk-or-...",
    model: "openrouter/anthropic/claude-sonnet-4-5-20250929",
  },
];

type Phase = "checking" | "detected" | "provider" | "key";

export function ApiKeySetup({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [selected, setSelected] = useState<(typeof PROVIDERS)[number] | null>(null);
  const [existing, setExisting] = useState<{ provider: (typeof PROVIDERS)[number]; maskedKey: string } | null>(null);

  useEffect(() => {
    getExistingApiKey().then((found) => {
      if (found) {
        const provider = PROVIDERS.find((p) => p.envVar === found.envVar);
        if (provider) {
          setExisting({ provider, maskedKey: found.maskedKey });
          setPhase("detected");
          return;
        }
      }
      setPhase("provider");
    });
  }, []);

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
      model: selected.model,
    });
  };

  const handleDetectedChoice = (value: string) => {
    if (value === "keep" && existing) {
      onComplete({
        provider: existing.provider.value,
        apiKey: "",
        envVar: existing.provider.envVar,
        model: existing.provider.model,
      });
    } else {
      setPhase("provider");
    }
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>LLM Provider</Text>

      {phase === "checking" && <Spinner label="Checking for existing API key..." />}

      {phase === "detected" && existing && (
        <Box flexDirection="column" gap={1}>
          <Text color="green">API key detected for {existing.provider.label.split("—")[0].trim()}</Text>
          <Text dimColor>Key: {existing.maskedKey}</Text>
          <Text dimColor>Model: {existing.provider.model}</Text>
          <Text> </Text>
          <Select
            options={[
              { label: "Keep current API key", value: "keep" },
              { label: "Change provider / key", value: "change" },
            ]}
            onChange={handleDetectedChoice}
          />
        </Box>
      )}

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
          <Text dimColor>Model: {selected.model}</Text>
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
