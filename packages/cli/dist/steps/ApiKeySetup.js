import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import { getExistingApiKey, getExistingModel } from "../lib/helpers.js";
export const PROVIDERS = [
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
            { label: "Claude 4 Sonnet (Recommended)", value: "openrouter/anthropic/claude-4-sonnet" },
            { label: "Claude Sonnet 4.5", value: "openrouter/anthropic/claude-sonnet-4-5-20250929" },
            { label: "Gemini 2.5 Pro", value: "openrouter/google/gemini-2.5-pro" },
            { label: "Gemini 2.5 Flash", value: "openrouter/google/gemini-2.5-flash" },
            { label: "DeepSeek V3.1", value: "openrouter/deepseek/deepseek-chat-v3.1" },
            { label: "Grok Code Fast", value: "openrouter/x-ai/grok-code-fast-1" },
            { label: "Qwen3 Coder 480B", value: "openrouter/qwen/qwen3-coder-480b-a35b-07-25" },
            { label: "Llama 3.3 70B", value: "openrouter/meta-llama/llama-3.3-70b-instruct" },
            { label: "GPT-OSS 120B (Free)", value: "openrouter/openai/gpt-oss-120b:free" },
            { label: "Gemini 2.5 Flash (Free)", value: "openrouter/google/gemini-2.5-flash:free" },
            { label: "DeepSeek V3.2 (Free)", value: "openrouter/deepseek/deepseek-v3.2-20251201:free" },
        ],
    },
];
export function ApiKeySetup({ onComplete }) {
    const [phase, setPhase] = useState("checking");
    const [selected, setSelected] = useState(null);
    const [selectedModel, setSelectedModel] = useState("");
    const [existing, setExisting] = useState(null);
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
    const handleProvider = (value) => {
        const provider = PROVIDERS.find((p) => p.value === value);
        setSelected(provider);
        setPhase("model");
    };
    const handleModel = (value) => {
        setSelectedModel(value);
        if (keepExistingKey && existing) {
            onComplete({
                provider: existing.provider.value,
                apiKey: "",
                envVar: existing.provider.envVar,
                model: value,
            });
        }
        else {
            setPhase("key");
        }
    };
    const handleKey = (value) => {
        const trimmed = value.trim();
        if (!trimmed || !selected)
            return;
        onComplete({
            provider: selected.value,
            apiKey: trimmed,
            envVar: selected.envVar,
            model: selectedModel,
        });
    };
    const handleDetectedChoice = (value) => {
        if (value === "reuse" && existing && existing.model) {
            onComplete({
                provider: existing.provider.value,
                apiKey: "",
                envVar: existing.provider.envVar,
                model: existing.model,
            });
        }
        else if (value === "keep" && existing) {
            setKeepExistingKey(true);
            setSelected(existing.provider);
            setPhase("model");
        }
        else {
            setPhase("provider");
        }
    };
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "LLM Provider" }), phase === "checking" && _jsx(Spinner, { label: "Checking for existing API key..." }), phase === "detected" && existing && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "green", children: "Existing OpenClaw config detected" }), _jsxs(Text, { dimColor: true, children: ["Provider: ", existing.provider.label.split("—")[0].trim()] }), _jsxs(Text, { dimColor: true, children: ["Key: ", existing.maskedKey] }), existing.model && _jsxs(Text, { dimColor: true, children: ["Model: ", existing.model] }), _jsx(Text, { children: " " }), _jsx(Select, { options: [
                            ...(existing.model
                                ? [{ label: "Use existing setup", value: "reuse" }]
                                : []),
                            { label: "Keep key, change model", value: "keep" },
                            { label: "Change provider / key", value: "change" },
                        ], onChange: handleDetectedChoice })] })), phase === "provider" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "Which AI provider should your agent use?" }), _jsx(Select, { options: PROVIDERS.map((p) => ({ label: p.label, value: p.value })), onChange: handleProvider })] })), phase === "model" && selected && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Provider: ", selected.label.split("—")[0].trim()] }), _jsx(Text, { children: "Which model should your agent use?" }), _jsx(Select, { options: selected.models, onChange: handleModel })] })), phase === "key" && selected && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Provider: ", selected.label.split("—")[0].trim()] }), _jsxs(Text, { dimColor: true, children: ["Model: ", selectedModel] }), _jsx(Text, { children: " " }), _jsxs(Text, { children: ["Enter your ", selected.label.split(" ")[0], " API key:"] }), _jsxs(Text, { dimColor: true, children: ["Format: ", selected.hint] }), _jsx(TextInput, { placeholder: selected.hint, onSubmit: handleKey })] }))] }));
}
