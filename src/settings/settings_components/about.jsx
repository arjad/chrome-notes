import React from "react";
import Contributors from "../../components/contributors.jsx";

const About = () => {
  return (
    <div className="p-3 row">
      <div className="card-body col-8">
        <p className="text-muted">
          iNotes is a lightweight, open-source Chrome extension designed to help you take and manage notes directly in your browser.
          It’s perfect for quick thoughts, reminders, and to-dos.
        </p>

        <h6 className="mt-4">✨ Features</h6>
        <ul className="mx-auto">
          <li>📝 Create, edit, and delete notes easily</li>
          <li>📌 Pin important notes for quick access</li>
          <li>⏰ Set alarms/reminders on any note</li>
          <li>📋 One-click copy to clipboard</li>
          <li>🌐 Open-source and privacy-respecting</li>
        </ul>

        <h6 className="mt-4">🛠️ How to Install</h6>
        <p className="text-muted">
          1. Download the extension from the Chrome Web Store or GitHub.<br />
          2. Click <strong>“Add to Chrome”</strong>.<br />
          3. Start taking notes right from your browser toolbar!
        </p>

        <h6 className="mt-4">💡 Why Use iNotes?</h6>
        <p className="text-muted">
          Unlike bulky note-taking apps, iNotes is fast, distraction-free, and always accessible. 
          No sign-in required, no syncing hassles — just your notes, instantly.
        </p>

        <h6 className="mt-4">📬 Feedback & Contributions</h6>
        <p className="text-muted">
          Found a bug or have a suggestion?<br />
          Contribute on{" "}
          <a
            href="https://github.com/arjad/chrome-notes"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>{" "}
          or open an issue. We’d love to hear from you!
        </p>
      </div>
      <div className="col-4">
       <Contributors />
      </div>
    </div>
  );
};

export default About;
