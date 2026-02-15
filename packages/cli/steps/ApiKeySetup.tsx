import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import { getExistingApiKey, getExistingModel } from "../lib/helpers.js";

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
  models: { label: string; value: string }[];
}[] = [
  {
    label: "Anthropic (Claude) — Recommended",
    value: "anthropic",
    envVar: "ANTHROPIC_API_KEY",
    hint: "sk-ant-...",
    models: [
      { label: "Claude Sonnet 4.5 (Recommended)", value: "anthropic/claude-sonnet-4-5-20250929" },
      { label: "Claude Opus 4.6", value: "anthropic/claude-opus-4-6" },
      { label: "Claude Haiku 4.5", value: "anthropic/claude-haiku-4-5-20251001" },
    ],
  },
  {
    label: "OpenAI (GPT)",
    value: "openai",
    envVar: "OPENAI_API_KEY",
    hint: "sk-...",
    models: [
      { label: "GPT-4o (Recommended)", value: "openai/gpt-4o" },
      { label: "GPT-4o Mini", value: "openai/gpt-4o-mini" },
      { label: "o3-mini", value: "openai/o3-mini" },
    ],
  },
  {
    label: "Google (Gemini)",
    value: "gemini",
    envVar: "GEMINI_API_KEY",
    hint: "AIza...",
    models: [
      { label: "Gemini 2.5 Pro (Recommended)", value: "google/gemini-2.5-pro" },
      { label: "Gemini 2.5 Flash", value: "google/gemini-2.5-flash" },
    ],
  },
  {
    label: "Groq",
    value: "groq",
    envVar: "GROQ_API_KEY",
    hint: "gsk_...",
    models: [
      { label: "Llama 3.3 70B (Recommended)", value: "groq/llama-3.3-70b-versatile" },
      { label: "DeepSeek R1 Distill 70B", value: "groq/deepseek-r1-distill-llama-70b" },
    ],
  },
  {
    label: "OpenRouter",
    value: "openrouter",
    envVar: "OPENROUTER_API_KEY",
    hint: "sk-or-...",
    models: [
      { label: "Claude Sonnet 4.5 (Recommended)", value: "openrouter/anthropic/claude-sonnet-4-5-20250929" },
      { label: "Gemini 2.5 Pro", value: "openrouter/google/gemini-2.5-pro" },
      { label: "Llama 3.3 70B", value: "openrouter/meta-llama/llama-3.3-70b-instruct" },
    ],
  },
];

type Phase = "checking" | "detected" | "provider" | "model" | "key";

export function ApiKeySetup({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [selected, setSelected] = useState<(typeof PROVIDERS)[number] | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [existing, setExisting] = useState<{ provider: (typeof PROVIDERS)[number]; maskedKey: string; model: string | null } | null>(null);
  const [keepExistingKey, setKeepExistingKey] = useState(false);

  useEffect(() => {
    Promise.all([getExistingApiKey(), getExistingModel()]).then(([found, existingModel]) => {
      if (found) {
        const provider = PROVIDERS.find((p) => p.envVar === found.envVar);
        if (provider) {
          setExisting({ provider, maskedKey: found.maskedKey, model: existingModel });
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
    setPhase("model");
  };

  const handleModel = (value: string) => {
    setSelectedModel(value);
    if (keepExistingKey && existing) {
      onComplete({
        provider: existing.provider.value,
        apiKey: "",
        envVar: existing.provider.envVar,
        model: value,
      });
    } else {
      setPhase("key");
    }
  };

  const handleKey = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || !selected) return;
    onComplete({
      provider: selected.value,
      apiKey: trimmed,
      envVar: selected.envVar,
      model: selectedModel,
    });
  };

  const handleDetectedChoice = (value: string) => {
    if (value === "reuse" && existing && existing.model) {
      onComplete({
        provider: existing.provider.value,
        apiKey: "",
        envVar: existing.provider.envVar,
        model: existing.model,
      });
    } else if (value === "keep" && existing) {
      setKeepExistingKey(true);
      setSelected(existing.provider);
      setPhase("model");
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
          <Text color="green">Existing OpenClaw config detected</Text>
          <Text dimColor>Provider: {existing.provider.label.split("—")[0].trim()}</Text>
          <Text dimColor>Key: {existing.maskedKey}</Text>
          {existing.model && <Text dimColor>Model: {existing.model}</Text>}
          <Text> </Text>
          <Select
            options={[
              ...(existing.model
                ? [{ label: "Use existing setup", value: "reuse" }]
                : []),
              { label: "Keep key, change model", value: "keep" },
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

      {phase === "model" && selected && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Provider: {selected.label.split("—")[0].trim()}</Text>
          <Text>Which model should your agent use?</Text>
          <Select
            options={selected.models}
            onChange={handleModel}
          />
        </Box>
      )}

      {phase === "key" && selected && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Provider: {selected.label.split("—")[0].trim()}</Text>
          <Text dimColor>Model: {selectedModel}</Text>
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
