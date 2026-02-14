import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { ConfirmInput, Spinner } from "@inkjs/ui";
import { isOpenClawInstalled, installOpenClaw } from "../lib/helpers.js";
export function Prerequisites({ onComplete }) {
    const [state, setState] = useState("checking");
    useEffect(() => {
        if (isOpenClawInstalled()) {
            setState("installed");
            const timer = setTimeout(onComplete, 1000);
            return () => clearTimeout(timer);
        }
        else {
            setState("missing");
        }
    }, []);
    const handleConfirm = () => {
        setState("installing");
        setTimeout(() => {
            const ok = installOpenClaw();
            if (ok) {
                setState("installed_now");
                setTimeout(onComplete, 1000);
            }
            else {
                setState("failed");
            }
        }, 100);
    };
    const handleCancel = () => {
        setState("failed");
    };
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "Checking prerequisites..." }), state === "checking" && _jsx(Spinner, { label: "Checking OpenClaw..." }), state === "installed" && (_jsx(Text, { color: "green", children: "\u2713 OpenClaw is installed" })), state === "missing" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "yellow", children: "OpenClaw is not installed." }), _jsxs(Box, { children: [_jsx(Text, { children: "Install OpenClaw now? " }), _jsx(ConfirmInput, { onConfirm: handleConfirm, onCancel: handleCancel })] })] })), state === "installing" && _jsx(Spinner, { label: "Installing OpenClaw..." }), state === "installed_now" && (_jsx(Text, { color: "green", children: "\u2713 OpenClaw installed successfully" })), state === "failed" && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "red", children: "\u2717 OpenClaw is required." }), _jsx(Text, { dimColor: true, children: "Install manually: npm install -g openclaw@latest" })] }))] }));
}
