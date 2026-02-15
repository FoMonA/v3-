import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { Select } from "@inkjs/ui";
export function ExistingWorkspace({ workspaces, onUpdate, onNew, onCancel }) {
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { color: "yellow", children: ["Existing workspace", workspaces.length > 1 ? "s" : "", " found:"] }), workspaces.map((ws) => (_jsxs(Text, { dimColor: true, children: ["  ", ws] }, ws))), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "What would you like to do?" }) }), _jsx(Select, { options: [
                    { label: "Update templates and scripts", value: "update" },
                    { label: "Set up a new agent (new wallet)", value: "new" },
                    { label: "Cancel", value: "cancel" },
                ], onChange: (value) => {
                    if (value === "update")
                        onUpdate();
                    else if (value === "new")
                        onNew();
                    else
                        onCancel();
                } })] }));
}
