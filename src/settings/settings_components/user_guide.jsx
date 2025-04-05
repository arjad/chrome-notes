import React from "react";

const UserGuide = () => {
  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold">1. Introduction to I Notes</h2>
      <p>I Notes is a simple and efficient tool designed to help you create, manage, and customize notes quickly. This guide will walk you through the key features, including creating, editing, deleting notes, changing themes, and adjusting the popup size.</p>
      
      <h2 className=" mt-4">2. How to Use I Notes</h2>
      <h3 className="m">Creating a New Note</h3>
      <ul>
        <li>Open the I Notes extension.</li>
        <li>Click on the “+ New Note” button.</li>
        <li>Type your content in the text area.</li>
        <li>Click “Save” to store your note.</li>
      </ul>

      <h3 className="font-medium mt-2">Editing a Note</h3>
      <ul className="list-disc ml-6">
        <li>Open I Notes and locate the note you want to edit.</li>
        <li>Click the “Edit” button (pencil icon).</li>
        <li>Make your changes.</li>
        <li>Click “Save” to update the note.</li>
      </ul>
      
      <h3 className="font-medium mt-2">Deleting a Note</h3>
      <ul className="list-disc ml-6">
        <li>Find the note you wish to delete.</li>
        <li>Click the “Delete” button (trash bin icon).</li>
        <li>Confirm the deletion when prompted.</li>
      </ul>
      
      <h2 className="text-lg font-semibold mt-4">3. Customizing I Notes</h2>
      <h3 className="font-medium">Changing the Theme</h3>
      <ul className="list-disc ml-6">
        <li>Open the settings menu (gear icon).</li>
        <li>Look for the "Theme" option.</li>
        <li>Select your preferred theme (Light, Dark, Custom).</li>
        <li>The theme will update instantly.</li>
      </ul>
      
      <h3 className="font-medium mt-2">Adjusting Popup Size</h3>
      <ul className="list-disc ml-6">
        <li>Open the settings menu.</li>
        <li>Find the "Popup Size" option.</li>
        <li>Choose from available sizes (Small, Medium, Large).</li>
        <li>The popup window will resize accordingly.</li>
      </ul>
      
      <h2 className="text-lg font-semibold mt-4">4. Additional Features</h2>
      <ul className="list-disc ml-6">
        <li><strong>Search Notes:</strong> Use the search bar at the top to quickly find notes.</li>
        <li><strong>Pin Important Notes:</strong> Pin notes to keep them at the top.</li>
        <li><strong>Export Notes:</strong> Export notes to a file for backup or sharing.</li>
      </ul>
      
      <h2 className="text-lg font-semibold mt-4">5. Troubleshooting</h2>
      <ul className="list-disc ml-6">
        <li><strong>Notes Not Saving:</strong> Ensure you click "Save" after editing.</li>
        <li><strong>Theme Not Changing:</strong> Refresh I Notes after selecting a new theme.</li>
        <li><strong>Popup Size Not Adjusting:</strong> Check if your browser allows resizing.</li>
      </ul>
      
      <h2 className="text-lg font-semibold mt-4">6. Conclusion</h2>
      <p>I Notes makes note-taking simple and customizable. With options to edit, delete, change themes, and resize the popup, you can tailor the experience to your preference.</p>
      <p className="font-semibold">Enjoy using I Notes!</p>
    </div>
  );
};

export default UserGuide;