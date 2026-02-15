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
export declare const PROVIDERS: {
    label: string;
    value: LlmProvider;
    envVar: string;
    hint: string;
    models: {
        label: string;
        value: string;
    }[];
}[];
export declare function ApiKeySetup({ onComplete }: Props): import("react/jsx-runtime").JSX.Element;
export {};
