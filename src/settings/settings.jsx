import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./settings.css";
import Contributrors from "../components/contributors.jsx";
import jsPDF from "jspdf";
import 'jspdf-autotable';

function Settings() {
  const [notes, setNotes] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [popupSize, setPopupSize] = useState("medium");
  const [sortOption, setSortOption] = useState("date-desc");
  const [exportFormat, setExportFormat] = useState("csv");

  useEffect(() => {
    chrome.storage.local.get(["notes", "settings", "popupSize", "sortOption"], (result) => {
      if (result.settings !== undefined) {
        setDarkMode(result.darkMode);
        if (result.settings.darkMode) {
          document.body.classList.add("dark-mode");
        }
      }
      if (result.settings.popupSize) setPopupSize(result.settings.popupSize);
      if (result.settings.sortOption) setSortOption(result.settings.sortOption);
      if (result.notes) {
        setNotes(result.notes);
      }
    });
  }, []);
  const handleDarkModeChange = (e) => {
    const value = e.target.checked;
    setDarkMode(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, darkMode: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });
  
    if (value) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };
  const handlePopupSizeChange = (e) => {
    const value = e.target.value;
    setPopupSize(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, popupSize: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });
  };
  
  const handleSortOptionChange = (e) => {
    const value = e.target.value;
    setSortOption(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, sortOption: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });
  };

  const exportPDF = (e) => {
    const pdf = new jsPDF();
    pdf.text("Notes Export", 10, 10);
    
    const headers = ["ID", "Content", "Date"];
    const data = notes.map(note => [
      note.id.toString(), 
      note.text,
      formatDateForExport(note.date)
    ]);
    
    const colWidths = [50, 100, 70];
    
    let y = 20;
    pdf.setFont(undefined, 'bold');
    let xPos = 10;
    headers.forEach((header, i) => {
      pdf.text(header, xPos, y);
      xPos += colWidths[i];
    });
    pdf.setFont(undefined, 'normal');
    y += 10;
    
    data.forEach(row => {
      xPos = 10;
      if (row[1].length > 30) {
        const splitText = pdf.splitTextToSize(row[1], 90);
        pdf.text(row[0], xPos, y);
        xPos += colWidths[0];
        pdf.text(splitText, xPos, y);
        xPos += colWidths[1];
        pdf.text(row[2], xPos, y);
        y += Math.max(10, splitText.length * 7);
      } else {
        row.forEach((cell, i) => {
          pdf.text(cell, xPos, y);
          xPos += colWidths[i];
        });
        y += 10;
      }
      pdf.line(10, y - 5, 190, y - 5);
      
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
    });
    
    pdf.save("i_notes.pdf");
  };

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
    else if (exportFormat === "pdf") {
      exportPDF();
      return;
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
    <div>
      <div className="container settings-layout">
        <h2>Settings</h2>
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card mb-4">
              <div className="card-body text-center">
                <img
                  src="../assets/note.png"
                  width="48"
                  height="48"
                  alt="i Notes Logo"
                  className="mb-3"
                />
                <h5>About i Notes</h5>
                <p className="text-muted">
                  A simple and efficient Chrome extension that lets you manage
                  notes effortlessly.
                </p>
                <div className="list-group list-group-flush text-start">
                  <div className="list-group-item border-0">
                    <i className="fas fa-plus-circle text-primary me-2"></i>
                    Add & Delete Notes
                  </div>
                  <div className="list-group-item border-0">
                    <i className="fas fa-copy text-primary me-2"></i>
                    One-Click Copy
                  </div>
                  <div className="list-group-item border-0">
                    <i className="fas fa-search text-primary me-2"></i>
                    Quick Search
                  </div>
                  <div className="list-group-item border-0">
                    <i className="fas fa-sort text-primary me-2"></i>
                    Smart Organization
                  </div>
                </div>
              </div>
            </div>

            <Contributrors />
          </div>

          <div className="col-12 col-lg-8">
            <div className="card">
              <div className="card-body">
                <div className="mb-4">
                  <h6 className="mb-3">Display</h6>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="dark-mode-toggle"
                      checked={darkMode}
                      onChange={handleDarkModeChange}
                    />
                    <label className="form-check-label" htmlFor="dark-mode-toggle">
                      Enable Dark Mode
                    </label>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="form-label">Popup Size</label>
                  <select id="popup-size" className="form-select" value={popupSize} onChange={handlePopupSizeChange}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <hr />

                <div className="mb-4">
                  <h6 className="mb-3">General preferences</h6>
                  <div className="mb-3">
                    <label className="form-label">Sort Notes</label>
                    <select id="sort-options" className="form-select" value={sortOption} onChange={handleSortOptionChange}>
                      <option value="date-desc">Newest to Oldest</option>
                      <option value="date-asc">Oldest to Newest</option>
                      <option value="alpha-asc">A-Z</option>
                      <option value="alpha-desc">Z-A</option>
                    </select>
                  </div>
                </div>

                <hr />
                <div className="mb-4">
                  <h6 className="mb-3">Export Notes</h6>
                  <div className="mb-3">
                    <label className="form-label">Choose Format</label>
                    <div className="d-flex gap-2">
                    <select className="form-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                      <option value="csv">CSV</option>
                      <option value="html">HTML</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button className="btn btn-primary" onClick={exportNotes}>Export</button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-muted mb-3">
                    Help us improve! Your feedback matters.
                  </p>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSf_257jhT9AKWnVRDjT9EUgUpqgF3Qr2o_V3YchvwshOfXhfA/viewform?usp=sharing"
                    target="_blank"
                    className="btn btn-primary"
                  >
                    <i className="fas fa-star me-2"></i>
                    Review Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById("settings-target");
const root = createRoot(container);
root.render(<Settings />);
