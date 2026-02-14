#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { render } from "ink";
import { App } from "./App.js";
import { UpdateApp } from "./UpdateApp.js";
function Root() {
    const [mode, setMode] = useState(process.argv.includes("--update") ? "update" : "setup");
    if (mode === "update") {
        return _jsx(UpdateApp, {});
    }
    return _jsx(App, { onSwitchToUpdate: () => setMode("update") });
}
render(_jsx(Root, {}));
