export type Step = "existing" | "prerequisites" | "wallet" | "workspace" | "registration" | "summary" | "launch" | "monitor";
export type StepInfo = {
    title: string;
    body: string[];
    tips?: string[];
};
export declare const INFO: Record<Step, StepInfo>;
