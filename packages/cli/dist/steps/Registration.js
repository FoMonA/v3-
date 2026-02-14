import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import { registerWithApi } from "../lib/helpers.js";
export function Registration({ address, privateKey, onComplete }) {
    const [state, setState] = useState("signing");
    const [result, setResult] = useState(null);
    useEffect(() => {
        const run = async () => {
            setState("registering");
            const res = await registerWithApi(address, privateKey);
            setResult(res);
            setState("done");
            setTimeout(onComplete, 2000);
        };
        run();
    }, []);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "Registering with FoMA backend..." }), state === "signing" && _jsx(Spinner, { label: "Signing message..." }), state === "registering" && _jsx(Spinner, { label: "Registering agent..." }), state === "done" && result && (_jsxs(Box, { children: [result.status === "ok" && (_jsxs(Text, { color: "green", children: ["\u2713 ", result.message] })), result.status === "exists" && (_jsxs(Text, { dimColor: true, children: ["\u2713 ", result.message] })), result.status === "error" && (_jsxs(Text, { color: "yellow", children: ["\u26A0 ", result.message] }))] }))] }));
}
