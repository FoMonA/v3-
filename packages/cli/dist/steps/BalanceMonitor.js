import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { getMonBalance, getFomaBalance, checkGatewayStatus, stopGateway } from "../lib/helpers.js";
import { NETWORK, CONTRACT_ADDRESSES } from "../lib/constants.js";
function monColor(val) {
    if (val > 0.3)
        return "green";
    if (val >= 0.1)
        return "yellow";
    return "red";
}
function fomaColor(val) {
    if (val >= 50)
        return "green";
    if (val >= 10)
        return "yellow";
    return "red";
}
function monStatus(val) {
    if (val > 0.3)
        return "Healthy";
    if (val >= 0.1)
        return "Low — top up soon";
    return "Critical — needs funding!";
}
function fomaStatus(val) {
    if (val >= 50)
        return "Healthy";
    if (val >= 10)
        return "Low — buy more FOMA";
    if (val > 0)
        return "Very low";
    return "None — buy FOMA to govern";
}
function bar(val, max, width) {
    const filled = Math.min(Math.round((val / max) * width), width);
    return "█".repeat(filled) + "░".repeat(width - filled);
}
function formatDelta(current, previous, decimals) {
    const diff = current - previous;
    if (diff === 0)
        return "";
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(decimals)}`;
}
export function BalanceMonitor({ address, agentId }) {
    const [balances, setBalances] = useState({
        mon: null,
        foma: null,
        updatedAt: "",
    });
    const prevBalances = useRef(null);
    const [deltas, setDeltas] = useState({ mon: "", foma: "" });
    const [activity, setActivity] = useState([]);
    const [agentStatus, setAgentStatus] = useState("checking");
    const { exit } = useApp();
    useInput((input) => {
        if (input === "q") {
            stopGateway();
            exit();
        }
        if (input === "b") {
            exit();
        }
    });
    const addActivity = (message, color = "white") => {
        const timestamp = new Date().toLocaleTimeString();
        setActivity((prev) => [...prev.slice(-5), { timestamp, message, color }]);
    };
    const fetchBalances = async () => {
        const updatedAt = new Date().toLocaleTimeString();
        // Check agent status in parallel with balances
        checkGatewayStatus().then(setAgentStatus);
        try {
            const [mon, foma] = await Promise.all([
                getMonBalance(address),
                getFomaBalance(address).catch(() => "0"),
            ]);
            const monVal = parseFloat(mon);
            const fomaVal = parseFloat(foma);
            // Compute deltas and detect trades
            if (prevBalances.current !== null) {
                const prevMon = prevBalances.current.mon;
                const prevFoma = prevBalances.current.foma;
                const monDelta = formatDelta(monVal, prevMon, 4);
                const fomaDelta = formatDelta(fomaVal, prevFoma, 2);
                setDeltas({ mon: monDelta, foma: fomaDelta });
                // Detect buy: FOMA went up, MON went down
                if (fomaVal > prevFoma && monVal < prevMon) {
                    const spent = (prevMon - monVal).toFixed(4);
                    const got = (fomaVal - prevFoma).toFixed(2);
                    addActivity(`Bought ${got} FOMA for ${spent} MON`, "green");
                }
                // Detect sell: FOMA went down, MON went up
                if (fomaVal < prevFoma && monVal > prevMon) {
                    const got = (monVal - prevMon).toFixed(4);
                    const sold = (prevFoma - fomaVal).toFixed(2);
                    addActivity(`Sold ${sold} FOMA for ${got} MON`, "yellow");
                }
                // Detect incoming MON (funded)
                if (monVal > prevMon && fomaVal === prevFoma) {
                    const received = (monVal - prevMon).toFixed(4);
                    addActivity(`Received ${received} MON`, "cyan");
                }
                // Detect gas spend (MON down, FOMA unchanged)
                if (monVal < prevMon && fomaVal === prevFoma) {
                    const spent = (prevMon - monVal).toFixed(4);
                    addActivity(`Gas spent: ${spent} MON`, "gray");
                }
            }
            else {
                setDeltas({ mon: "", foma: "" });
            }
            prevBalances.current = { mon: monVal, foma: fomaVal };
            setBalances({ mon, foma, updatedAt });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setBalances((prev) => ({ ...prev, error: msg, updatedAt }));
        }
    };
    useEffect(() => {
        fetchBalances();
        const interval = setInterval(fetchBalances, 30_000);
        return () => clearInterval(interval);
    }, []);
    const monVal = parseFloat(balances.mon ?? "0");
    const fomaVal = parseFloat(balances.foma ?? "0");
    const loading = balances.mon === null;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Agent Dashboard" }), _jsx(Text, { children: " " }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Agent ID:   " }), _jsx(Text, { bold: true, children: agentId })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Wallet:     " }), _jsx(Text, { color: "cyan", children: address })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Network:    " }), _jsxs(Text, { children: [NETWORK.name, " (", NETWORK.chainId, ")"] })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Explorer:   " }), _jsxs(Text, { dimColor: true, children: [NETWORK.explorer, "/address/", address] })] })] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "white", paddingX: 2, paddingY: 1, marginTop: 1, children: [_jsx(Text, { bold: true, children: "Balances" }), _jsx(Text, { children: " " }), loading ? (_jsx(Text, { dimColor: true, children: "Fetching balances..." })) : (_jsxs(_Fragment, { children: [_jsxs(Box, { children: [_jsx(Box, { width: 10, children: _jsx(Text, { bold: true, color: monColor(monVal), children: "MON" }) }), _jsx(Box, { width: 14, children: _jsx(Text, { color: monColor(monVal), children: monVal.toFixed(4) }) }), _jsx(Box, { width: 14, children: deltas.mon ? (_jsxs(Text, { color: deltas.mon.startsWith("+") ? "green" : "red", children: [deltas.mon.startsWith("+") ? "▲" : "▼", " ", deltas.mon] })) : (_jsx(Text, { dimColor: true, children: "  \u2014" })) }), _jsx(Box, { width: 14, children: _jsx(Text, { color: monColor(monVal), children: bar(monVal, 2, 10) }) }), _jsx(Text, { dimColor: true, children: monStatus(monVal) })] }), _jsxs(Box, { children: [_jsx(Box, { width: 10, children: _jsx(Text, { bold: true, color: fomaColor(fomaVal), children: "FOMA" }) }), _jsx(Box, { width: 14, children: _jsx(Text, { color: fomaColor(fomaVal), children: fomaVal.toFixed(2) }) }), _jsx(Box, { width: 14, children: deltas.foma ? (_jsxs(Text, { color: deltas.foma.startsWith("+") ? "green" : "red", children: [deltas.foma.startsWith("+") ? "▲" : "▼", " ", deltas.foma] })) : (_jsx(Text, { dimColor: true, children: "  \u2014" })) }), _jsx(Box, { width: 14, children: _jsx(Text, { color: fomaColor(fomaVal), children: bar(fomaVal, 200, 10) }) }), _jsx(Text, { dimColor: true, children: fomaStatus(fomaVal) })] })] })), balances.error && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "red", children: ["Error: ", balances.error] }) }))] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "magenta", paddingX: 2, paddingY: 1, marginTop: 1, children: [_jsx(Text, { bold: true, color: "magenta", children: "Activity" }), _jsx(Text, { children: " " }), activity.length === 0 ? (_jsx(Text, { dimColor: true, children: "Watching for trades, transfers, and gas usage..." })) : (activity.map((entry, i) => (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: ["[", entry.timestamp, "] "] }), _jsx(Text, { color: entry.color, children: entry.message })] }, i))))] }), _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "gray", paddingX: 2, paddingY: 1, marginTop: 1, children: [_jsx(Text, { bold: true, dimColor: true, children: "Contracts" }), _jsx(Text, { children: " " }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "FOMA Token: " }), _jsx(Text, { dimColor: true, children: CONTRACT_ADDRESSES.FOMA })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Governor:   " }), _jsx(Text, { dimColor: true, children: CONTRACT_ADDRESSES.GOVERNOR })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Registry:   " }), _jsx(Text, { dimColor: true, children: CONTRACT_ADDRESSES.REGISTRY })] })] }), _jsxs(Box, { marginTop: 1, paddingX: 1, gap: 2, children: [_jsxs(Text, { dimColor: true, children: ["Updated: ", balances.updatedAt || "..."] }), _jsx(Text, { dimColor: true, children: "\u00B7" }), _jsx(Text, { dimColor: true, children: "Refreshes every 30s" }), _jsx(Text, { dimColor: true, children: "\u00B7" }), _jsx(Text, { bold: true, color: "red", children: "q" }), _jsx(Text, { dimColor: true, children: " stop agent" }), _jsx(Text, { dimColor: true, children: "\u00B7" }), _jsx(Text, { bold: true, color: "green", children: "b" }), _jsx(Text, { dimColor: true, children: " background" }), _jsx(Text, { dimColor: true, children: "\u00B7" }), agentStatus === "checking" && _jsx(Text, { dimColor: true, children: "Checking agent..." }), agentStatus === "running" && _jsx(Text, { color: "green", children: "Agent running" }), agentStatus === "stopped" && _jsx(Text, { color: "red", children: "Agent stopped \u2014 run: openclaw gateway --force" })] })] }));
}
