import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { INFO } from "../lib/info.js";
import { NETWORK } from "../lib/constants.js";
export function InfoPanel({ step }) {
    const info = INFO[step];
    return (_jsxs(Box, { flexDirection: "column", width: "35%", borderStyle: "round", borderColor: "cyan", paddingX: 1, paddingY: 0, children: [_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { bold: true, color: "cyan", children: ["💡 ", info.title] }) }), info.body.map((paragraph, i) => (_jsx(Box, { marginBottom: i < info.body.length - 1 ? 1 : 0, children: _jsx(Text, { children: paragraph }) }, i))), info.tips && info.tips.length > 0 && (_jsx(Box, { flexDirection: "column", marginTop: 1, children: info.tips.map((tip, i) => (_jsxs(Text, { dimColor: true, children: ["\u2022 ", tip] }, i))) })), _jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "single", borderTop: true, borderBottom: false, borderLeft: false, borderRight: false, borderColor: "gray", children: [_jsxs(Box, { marginTop: 0, children: [_jsx(Text, { dimColor: true, children: "Network: " }), _jsxs(Text, { children: [NETWORK.name, " (", NETWORK.chainId, ")"] })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "RPC: " }), _jsx(Text, { dimColor: true, children: NETWORK.rpc })] })] })] }));
}
