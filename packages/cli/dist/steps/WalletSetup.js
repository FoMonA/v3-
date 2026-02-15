import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import { generateWallet, importWallet, isValidPrivateKey, generateUserId, } from "../lib/helpers.js";
export function WalletSetup({ onComplete }) {
    const [phase, setPhase] = useState("choose");
    const [wallet, setWallet] = useState(null);
    const [minFoma, setMinFoma] = useState(50);
    const [error, setError] = useState(null);
    const onWalletReady = (address, privateKey) => {
        const userId = generateUserId(address);
        setWallet({ address, privateKey, userId });
        setPhase("config");
    };
    const handleChoice = (value) => {
        if (value === "generate") {
            setPhase("generating");
            setTimeout(() => {
                const { address, privateKey } = generateWallet();
                onWalletReady(address, privateKey);
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
        onWalletReady(address, privateKey);
    };
    const handleMinFoma = (value) => {
        const num = parseInt(value.trim(), 10);
        if (isNaN(num) || num < 0) {
            setError("Enter a valid number (e.g. 50)");
            return;
        }
        setError(null);
        setMinFoma(num);
        setPhase("done");
        setTimeout(() => {
            onComplete({
                address: wallet.address,
                privateKey: wallet.privateKey,
                userId: wallet.userId,
                minFoma: num,
            });
        }, 1000);
    };
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "Wallet Setup" }), phase === "choose" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "How would you like to set up your agent wallet?" }), _jsx(Select, { options: [
                            { label: "Generate a new wallet", value: "generate" },
                            { label: "Import an existing private key", value: "import" },
                        ], onChange: handleChoice })] })), phase === "generating" && _jsx(Spinner, { label: "Generating new wallet..." }), phase === "import" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "Enter your private key (hex):" }), _jsx(TextInput, { placeholder: "0x...", onSubmit: handleImport }), error && _jsx(Text, { color: "red", children: error })] })), phase === "config" && wallet && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "green", children: "\u2713 Wallet ready" }), _jsxs(Text, { dimColor: true, children: ["  Address: ", wallet.address] }), _jsxs(Text, { dimColor: true, children: ["  User ID: foma-", wallet.userId] }), _jsx(Text, { children: " " }), _jsx(Text, { children: "Minimum FOMA balance to maintain?" }), _jsx(Text, { dimColor: true, children: "Your agent auto-buys FOMA when below this threshold." }), _jsx(TextInput, { defaultValue: "50", onSubmit: handleMinFoma }), error && _jsx(Text, { color: "red", children: error })] })), phase === "done" && wallet && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "green", children: "\u2713 Wallet ready" }), _jsxs(Text, { dimColor: true, children: ["  Address: ", wallet.address] }), _jsxs(Text, { dimColor: true, children: ["  User ID: foma-", wallet.userId] }), _jsxs(Text, { dimColor: true, children: ["  Min FOMA: ", minFoma] })] }))] }));
}
