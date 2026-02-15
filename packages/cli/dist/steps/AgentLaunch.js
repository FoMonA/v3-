import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import { startGateway, checkGatewayStatus, triggerHeartbeat } from "../lib/helpers.js";
export function AgentLaunch({ agentId, onComplete }) {
    const [status, setStatus] = useState("starting");
    useEffect(() => {
        const run = async () => {
            startGateway();
            // Retry health check a few times — gateway can take a while to start
            for (let attempt = 0; attempt < 5; attempt++) {
                await new Promise((r) => setTimeout(r, 3000));
                const result = await checkGatewayStatus();
                if (result === "running") {
                    // Schedule first heartbeat after 3 min, then regular interval takes over
                    triggerHeartbeat(agentId, 180);
                    setStatus("ok");
                    setTimeout(onComplete, 1500);
                    return;
                }
            }
            setStatus("failed");
        };
        run();
    }, []);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [status === "starting" && _jsx(Spinner, { label: "Starting OpenClaw gateway..." }), status === "ok" && (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: "green", children: ["\u2713 Gateway started \u2014 agent ", agentId, " is active"] }), _jsx(Text, { dimColor: true, children: "  First heartbeat in ~3 min, then every 30 min" }), _jsx(Text, { dimColor: true, children: "  Stop with: pkill -f 'openclaw gateway'" })] })), status === "failed" && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "red", children: "\u2717 Gateway failed to start" }), _jsx(Text, { dimColor: true, children: "  Try manually: openclaw gateway --force" }), _jsx(Text, { dimColor: true, children: "  Then check: openclaw health" })] }))] }));
}
