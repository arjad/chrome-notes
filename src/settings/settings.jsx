import React from "react";
import { createRoot } from "react-dom/client";

function Settings() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Settings Page</h2>
    </div>
  );
}

const container = document.getElementById("settings-target");
const root = createRoot(container);
root.render(<Settings />);
