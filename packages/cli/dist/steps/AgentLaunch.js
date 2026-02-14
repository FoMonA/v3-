import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import { startAgent } from "../lib/helpers.js";
export function AgentLaunch({ agentId, onComplete }) {
    const [launched, setLaunched] = useState(false);
    useEffect(() => {
        startAgent(agentId);
        setLaunched(true);
        const timer = setTimeout(onComplete, 1500);
        return () => clearTimeout(timer);
    }, []);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [!launched && _jsx(Spinner, { label: `Starting agent ${agentId}...` }), launched && (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: "green", children: ["\u2713 Agent ", agentId, " started in the background"] }), _jsxs(Text, { dimColor: true, children: ["  Stop with: openclaw stop ", agentId] })] }))] }));
}
