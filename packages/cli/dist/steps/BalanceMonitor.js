import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { getMonBalance } from "../lib/helpers.js";
import { NETWORK } from "../lib/constants.js";
function balanceColor(balance) {
    const val = parseFloat(balance);
    if (val > 0.3)
        return "green";
    if (val >= 0.1)
        return "yellow";
    return "red";
}
export function BalanceMonitor({ address }) {
    const [entries, setEntries] = useState([]);
    const { exit } = useApp();
    useInput((input) => {
        if (input === "q") {
            exit();
        }
    });
    const fetchBalance = async () => {
        const timestamp = new Date().toLocaleTimeString();
        try {
            const balance = await getMonBalance(address);
            setEntries((prev) => [...prev.slice(-9), { timestamp, balance }]);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setEntries((prev) => [
                ...prev.slice(-9),
                { timestamp, balance: "0", error: msg },
            ]);
        }
    };
    useEffect(() => {
        fetchBalance();
        const interval = setInterval(fetchBalance, 30_000);
        return () => clearInterval(interval);
    }, []);
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "Balance Monitor" }), _jsx(Text, { dimColor: true, children: "Polling every 30s \u00B7 Press q to exit" }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [entries.length === 0 && _jsx(Text, { dimColor: true, children: "Fetching balance..." }), entries.map((entry, i) => (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: ["[", entry.timestamp, "]"] }), _jsxs(Text, { children: [" ", shortAddr, " "] }), entry.error ? (_jsxs(Text, { color: "red", children: ["Error: ", entry.error] })) : (_jsxs(Text, { color: balanceColor(entry.balance), children: [entry.balance, " ", NETWORK.currency] })), _jsxs(Text, { dimColor: true, children: [" (", NETWORK.name, ")"] })] }, i)))] })] }));
}
