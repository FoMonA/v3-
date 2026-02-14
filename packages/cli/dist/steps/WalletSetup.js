import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import { generateWallet, importWallet, isValidPrivateKey, generateUserId, } from "../lib/helpers.js";
export function WalletSetup({ onComplete }) {
    const [phase, setPhase] = useState("choose");
    const [walletData, setWalletData] = useState(null);
    const [error, setError] = useState(null);
    const handleChoice = (value) => {
        if (value === "generate") {
            setPhase("generating");
            setTimeout(() => {
                const { address, privateKey } = generateWallet();
                const userId = generateUserId(address);
                const data = { address, privateKey, userId };
                setWalletData(data);
                setPhase("done");
                setTimeout(() => onComplete(data), 1500);
            }, 100);
        }
        else {
            setPhase("import");
        }
    };
    const handleImport = (value) => {
        const key = value.trim();
        if (!isValidPrivateKey(key)) {
            setError("Invalid private key (expected 64 hex chars, optionally 0x-prefixed)");
            return;
        }
        setError(null);
        const { address, privateKey } = importWallet(key);
        const userId = generateUserId(address);
        const data = { address, privateKey, userId };
        setWalletData(data);
        setPhase("done");
        setTimeout(() => onComplete(data), 1500);
    };
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "Wallet Setup" }), phase === "choose" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "How would you like to set up your agent wallet?" }), _jsx(Select, { options: [
                            { label: "Generate a new wallet", value: "generate" },
                            { label: "Import an existing private key", value: "import" },
                        ], onChange: handleChoice })] })), phase === "generating" && _jsx(Spinner, { label: "Generating new wallet..." }), phase === "import" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "Enter your private key (hex):" }), _jsx(TextInput, { placeholder: "0x...", onSubmit: handleImport }), error && _jsx(Text, { color: "red", children: error })] })), phase === "done" && walletData && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "green", children: "\u2713 Wallet ready" }), _jsxs(Text, { dimColor: true, children: ["  Address: ", walletData.address] }), _jsxs(Text, { dimColor: true, children: ["  User ID: foma-", walletData.userId] })] }))] }));
}
