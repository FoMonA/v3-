#!/usr/bin/env node

import React, { useState } from "react";
import { render } from "ink";
import { App } from "./App.js";
import { UpdateApp } from "./UpdateApp.js";

function Root() {
  const [mode, setMode] = useState<"setup" | "update">(
    process.argv.includes("--update") ? "update" : "setup",
  );

  if (mode === "update") {
    return <UpdateApp />;
  }

  return <App onSwitchToUpdate={() => setMode("update")} />;
}

render(<Root />);
