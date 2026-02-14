import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from "ink";
import { InfoPanel } from "./InfoPanel.js";
export function Layout({ step, children }) {
    return (_jsxs(Box, { flexDirection: "row", width: "100%", children: [_jsx(Box, { flexDirection: "column", width: "65%", paddingRight: 1, children: children }), _jsx(InfoPanel, { step: step })] }));
}
