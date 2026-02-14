import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
const VISIBLE_STEPS = [
    { key: "prerequisites", label: "Prerequisites" },
    { key: "wallet", label: "Wallet" },
    { key: "workspace", label: "Workspace" },
    { key: "registration", label: "Register" },
    { key: "summary", label: "Launch" },
];
const STEP_ORDER = [
    "existing",
    "prerequisites",
    "wallet",
    "workspace",
    "registration",
    "summary",
    "launch",
    "monitor",
];
function getStepIndex(step) {
    return STEP_ORDER.indexOf(step);
}
export function StepProgress({ currentStep }) {
    const currentIdx = getStepIndex(currentStep);
    return (_jsx(Box, { marginBottom: 1, gap: 1, paddingLeft: 1, children: VISIBLE_STEPS.map((s) => {
            const stepIdx = getStepIndex(s.key);
            const isDone = currentIdx > stepIdx;
            const isCurrent = currentStep === s.key;
            if (isDone) {
                return (_jsxs(Box, { gap: 0, children: [_jsx(Text, { color: "green", children: "\u25CF " }), _jsx(Text, { color: "green", children: s.label }), _jsx(Text, { dimColor: true, children: "   " })] }, s.key));
            }
            if (isCurrent) {
                return (_jsxs(Box, { gap: 0, children: [_jsx(Text, { color: "cyan", children: "\u25D0 " }), _jsx(Text, { bold: true, color: "white", children: s.label }), _jsx(Text, { dimColor: true, children: "   " })] }, s.key));
            }
            return (_jsxs(Box, { gap: 0, children: [_jsx(Text, { dimColor: true, children: "\u25CB " }), _jsx(Text, { dimColor: true, children: s.label }), _jsx(Text, { dimColor: true, children: "   " })] }, s.key));
        }) }));
}
