import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

function Popup() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [alarmNoteId, setAlarmNoteId] = useState(null);
  const [alarmTime, setAlarmTime] = useState("");
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [popupSize, setpopupSize] = useState(false);
  const [sortOption, setsortOption] = useState('date-desc');

  useEffect(() => {
    chrome.storage.local.get(["notes", "settings", "popupSize", "sortOption"], (result) => {
      if (result.settings !== undefined) {
        setDarkMode(result.settings.darkMode);
        if (result.settings.darkMode) {
          document.body.classList.add("dark-mode");
        }
      }
      if (result.settings.popupSize !== undefined) {
        setpopupSize(result.settings.popupSize);
        if (result.settings.popupSize) {
          document.body.setAttribute("data-size", result.settings.popupSize);
        }
      }
      if (result.settings.sortOption !== undefined) {
        setsortOption(result.settings.sortOption);
      }
      if (result.notes) {
        setNotes(result.notes);
      }
    });
  }, []);

  const openAlarmModal = (id) => {
    console.log("Opening modal for note ID:", id);
    setAlarmNoteId(id);
    setIsAlarmModalOpen(true);
  };
  
  const closeAlarmModal = () => {
    console.log("Closing modal");
    setAlarmNoteId(null);
    setAlarmTime("");
    setIsAlarmModalOpen(false);
  };

  const setAlarm = () => {
    if (!alarmTime) return;
    const alarmName = `note-alarm-${alarmNoteId}`;
    
    chrome.alarms.create(alarmName, {
      when: new Date(alarmTime).getTime(),
    });
    
    closeAlarmModal();
  };

  const openSettingsPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
  };
  
  const handleInputChange = (e) => {
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

  // Add this logging to check state changes
  useEffect(() => {
    console.log("Modal open state changed:", isAlarmModalOpen);
  }, [isAlarmModalOpen]);

  function renderNotes() {
    console.log(notes)
    return notes
      .filter((note) => note.text.toLowerCase().includes(searchQuery))
      .sort((a, b) => {
        if (sortOption === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortOption === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortOption === 'alpha-asc') return a.text.localeCompare(b.text);
        if (sortOption === 'alpha-desc') return b.text.localeCompare(a.text);
        return 0;
      })
      .map((note) => (
        <div className="note-item" key={note.id}>
          <div>
            <div className="note-text">{note.text}</div>
            <span className="options" data-id={note.id}>
              <small className="date">{formatDate(note.date)}</small>
              <div className="icons">
                <i 
                  className="fa-solid fa-clock" 
                  style={{ cursor: "pointer" }}
                  onClick={() => openAlarmModal(note.id)}
                ></i>
                <i className="fas fa-trash delete-icon" onClick={() => deleteNote(note.id)}></i>
                <i className="fas fa-solid fa-pen" onClick={() => editNote(note.id, note.text)}></i>
                <i className="fa-solid fa-copy copy-icon" data-id={note.id} onClick={(e) => handleCopy(e, note.text)}></i>
              </div>
            </span>
          </div>
        </div>
      ));
}

  
  return (
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
          <i className="fa-solid fa-gear" style={{ cursor: "pointer" }} onClick={openSettingsPage}></i>
        </div>
      </nav>

      <div id="notes-list">{renderNotes()}</div>


      <textarea
        id="note-input"
        className="form-control bg-transparent input-tag my-2"
        rows="4"
        placeholder="Enter your note here..."
        value={note}
        onChange={handleInputChange}
      />

      <div className="position-relative pb-4 mb-1 pt-2">
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

      {/* Modal displayed using absolute positioning for Chrome extension */}
      {isAlarmModalOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
        >
          <div 
            style={{
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "280px"
            }}
          >
            <h3 className="fs-6 mb-3">Set Alarm</h3>
            <p>This feature will be added by the end of may</p>
            <input 
              type="datetime-local" 
              className="form-control"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
            />
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-sm btn-success" onClick={setAlarm}>Set</button>
              <button className="btn btn-sm btn-secondary" onClick={closeAlarmModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const container = document.getElementById("popup-target");
const root = createRoot(container);
root.render(<Popup />);
