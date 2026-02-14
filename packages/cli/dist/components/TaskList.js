import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
export function TaskList({ tasks }) {
    return (_jsx(Box, { flexDirection: "column", children: tasks.map((task, i) => (_jsxs(Box, { gap: 1, children: [task.status === "done" && _jsx(Text, { color: "green", children: "\u2713" }), task.status === "active" && _jsx(Spinner, { label: "" }), task.status === "pending" && _jsx(Text, { dimColor: true, children: "\u25CB" }), task.status === "error" && _jsx(Text, { color: "red", children: "\u2717" }), _jsx(Text, { color: task.status === "done"
                        ? "green"
                        : task.status === "error"
                            ? "red"
                            : task.status === "active"
                                ? "cyan"
                                : undefined, dimColor: task.status === "pending", children: task.label }), task.detail && (_jsxs(Text, { dimColor: true, children: [" \u2014 ", task.detail] }))] }, i))) }));
}
