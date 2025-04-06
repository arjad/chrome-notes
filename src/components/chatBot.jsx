import React, { useEffect } from "react";

export default function ChatBot() {
  useEffect(() => {
    window.chtlConfig = { chatbotId: "5424148781" };
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-id", "5424148781");
    script.id = "chatling-embed-script";
    script.type = "text/javascript";
    script.src = chrome.runtime.getURL("assets/chatling-embed.js");

    document.head.appendChild(script);
  }, []);

  return (
    <div></div>
  );
}
