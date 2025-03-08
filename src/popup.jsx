import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

function Popup() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(["notes"], (result) => {
      if (result.notes) {
        setNotes(result.notes);
      }
    });
  }, []);

  const openSettingsPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings/settings.html") });
  };
  
  const handleInputChange = (e) => {
    console.log(e.target.value);
    setNote(e.target.value);
    setError("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    chrome.storage.local.set({ notes: updatedNotes });
  };

  const editNote = (id, text) => {
    setEditingId(id);
    setNote(text);
  };
  
  const saveNote = () => {
    if (note.trim() === "") {
      setError("Please enter a note.");
      return;
    }
  
    if (editingId) {
      const updatedNotes = notes.map((n) =>
        n.id === editingId ? { ...n, text: note, date: new Date().toISOString() } : n
      );
      setNotes(updatedNotes);
      chrome.storage.local.set({ notes: updatedNotes });
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now().toString(),
        text: note,
        date: new Date().toISOString(),
        pinned: false,
      };
  
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      chrome.storage.local.set({ notes: updatedNotes });
    }
    setNote("");
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };
  const handleCopy = (event, text) => {
    navigator.clipboard.writeText(text)
    .then(() => {
        const icon = event.target;
        icon.classList.add("copy-icon-green");
        setTimeout(() => {
          icon.classList.remove("copy-icon-green");
        }, 1000);
    })
    .catch(err => console.error("Error copying text: ", err));
  };

  return (
    <div style={{ width: "300px" }}>
      <div className="container-fluid p-0">
        <nav className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <h6 className="d-flex align-items-center mb-0">
              <img src="assets/note.png" width="22" height="22" alt="Note Icon" />
              <span>
                <i className="i-notes bold mx-1 bold"> i </i>
                Notes
              </span>
            </h6>
          </div>
          <div className="d-flex align-items-center gap-2">
            <input
              type="text"
              id="search-input"
              onChange={handleSearchChange}
              className="form-control form-control-sm input-tag"
              placeholder="Search notes..."
            />
            <i  className="fa-solid fa-gear" style={{ cursor: "pointer" }} onClick={openSettingsPage}></i>
          </div>
        </nav>

        <div id="notes-list">
            {notes
            .filter((note) => note.text.toLowerCase().includes(searchQuery))
            .map((note) => (
                <div class="note-item">
                    <div>
                        <div class="note-text">{note.text}</div>
                        <span class="options" data-id="${note.id}">
                          <small class="date">{formatDate(note.date)}</small>
                          <div class="icons">
                              <i className="fas fa-trash delete-icon" onClick={() => deleteNote(note.id)}></i>
                              <i className="fas fa-solid fa-pen" onClick={() => editNote(note.id, note.text)}></i>
                              <i className="fa-solid fa-copy copy-icon" data-id={note.id} onClick={(e) => handleCopy(e, note.text)}></i>
                          </div>
                        </span>
                    </div>
                </div>
            ))}
        </div>

        <textarea
          id="note-input"
          className="form-control bg-transparent input-tag mb-2"
          rows="4"
          placeholder="Enter your note here..."
          value={note}
          onChange={handleInputChange}
        />

        <div className="position-relative pb-5 pt-2">
          {error && (
            <div className="error-msg text-danger small">
              <i className="fa-solid fa-circle-info me-1"></i>
              <span>{error}</span>
            </div>
          )}
          <button
            id="save-btn"
            className="btn btn-sm rounded-pill px-3 text-white position-absolute end-0 top-0"
            onClick={saveNote}
          >
            Save Note
          </button>
        </div>

        <div id="delete-modal" className="delete-modal d-none">
          <div className="modal-content p-3">
            <h3 className="fs-6 mb-3">Are you sure you want to delete this note?</h3>
            <div className="d-flex justify-content-center gap-2">
              <button id="confirm-delete" className="btn btn-sm btn-danger">
                Delete
              </button>
              <button id="cancel-delete" className="btn btn-sm btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById("popup-target");
const root = createRoot(container);
root.render(<Popup />);
