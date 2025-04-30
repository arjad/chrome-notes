import React, { useState, useEffect } from "react";

export default function ExportNotes() {
  const [notes, setNotes] = useState([]);
  const [exportFormat, setExportFormat] = useState("csv");

  useEffect(() => {
    chrome.storage.local.get(["notes"], (result) => {
      if (result.notes) {
        setNotes(result.notes);
      }
    });
  }, []);
  
  const exportNotes = () => {
    let data = "";
    const fileName = `i_notes.${exportFormat}`;

    if (exportFormat === "csv") {
      data = "ID,Content,Date\n" + notes.map(note => `${note.id},${note.text},${formatDateForExport(note.date)}`).join("\n");
    } else if (exportFormat === "html") {
      data = `
        <html><body>
          <h1>Notes</h1>
          <table border="1" cellspacing="0" cellpadding="5">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${notes.map(note => `
                <tr>
                  <td>${note.id}</td>
                  <td>${note.text}</td>
                  <td>${formatDateForExport(note.date)}</td>
                </tr>
                `).join("")}
            </tbody>
          </table>
        </body></html>`
    } 

    const blob = new Blob([data], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  };

  const formatDateForExport = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="mb-4">
        <h6 className="mb-3">Export Notes</h6>
        <div className="mb-3">
        <label className="form-label">Choose Format</label>
        <div className="d-flex gap-2">
        <select className="form-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="html">HTML</option>
        </select>
        <button className="btn btn-primary" onClick={exportNotes}>Export</button>
        </div>
        </div>
    </div>
  );
}
