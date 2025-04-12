import React, { useEffect } from "react";

export default function ChatBot() {
  useEffect(() => {
    window.chtlConfig = { chatbotId: process.env.CHATBOT_ID };
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-id", process.env.CHATBOT_ID);
    script.id = "chatling-embed-script";
    script.type = "text/javascript";
    script.src = chrome.runtime.getURL("assets/chatling-embed.js");

    document.head.appendChild(script);
  }, []);

  return (
    <div></div>
  );
}
