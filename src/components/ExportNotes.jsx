import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import 'jspdf-autotable';

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
  );
}
