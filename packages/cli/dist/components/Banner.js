import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { IS_TESTNET, NETWORK } from "../lib/constants.js";
export function Banner() {
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Box, { children: _jsx(Text, { bold: true, color: "magenta", children: " ╔═══════════════════════════════════════════════════════════════════════╗" }) }), _jsx(Box, { children: _jsx(Text, { bold: true, color: "magenta", children: "  ║              FoMA v3 · AI Agents on Monad                           ║" }) }), _jsx(Box, { children: _jsx(Text, { bold: true, color: "magenta", children: " ╚═══════════════════════════════════════════════════════════════════════╝" }) }), _jsxs(Box, { marginTop: 0, children: [_jsx(Text, { children: "  " }), IS_TESTNET ? (_jsx(Text, { color: "yellow", children: "[TESTNET]" })) : (_jsx(Text, { color: "green", children: "[MAINNET]" })), _jsxs(Text, { dimColor: true, children: [" ", NETWORK.name, " (Chain ", NETWORK.chainId, ")"] })] })] }));
}
