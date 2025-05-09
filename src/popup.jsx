import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";
import "./components/common_style.css"
import sanitizeHtml from "sanitize-html";
import RichTextEditor from "./components/RichText.jsx";
  
function Popup() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [sortOption, setsortOption] = useState('date-desc');
  const editorRef = useRef(null);
  const [detailedView, setDetailedView] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(["notes", "settings"], (result) => {
      if (result.settings !== undefined) {
        if (result.settings.darkMode == "dark" || (result.settings.darkMode == "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.body.classList.add("dark-mode");
        }
        if (result.settings.popupSize) {
          document.body.setAttribute("data-size", result.settings.popupSize);
        }
        setDetailedView(result.settings.detailedView);
        setsortOption(result.settings.sortOption);
      }
      if (result.notes) {
        setNotes(result.notes);
      }
    });
  }, []);

  const openSettingsPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
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
    if (editorRef.current) {
      editorRef.current.innerHTML = text;
    }
  };

  const saveNote = () => {
    if (editorRef.current.innerHTML.trim() === "") {
      setError("Please enter a note.");
      return;
    }
    setError("");
  
    const sanitizedHtml = sanitizeHtml(editorRef.current.innerHTML, {
      allowedTags: ["b", "i", "u", "p", "br", "strong", "em", "ul", "ol", "li"],
      allowedAttributes: {},
    });
  
    if (editingId) {
      const updatedNotes = notes.map((n) =>
        n.id === editingId ? { ...n, text: sanitizedHtml, date: new Date().toISOString() } : n
      );
      setNotes(updatedNotes);
      chrome.storage.local.set({ notes: updatedNotes });
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now().toString(),
        text: sanitizedHtml,
        date: new Date().toISOString(),
        pinned: false,
      };
  
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      chrome.storage.local.set({ notes: updatedNotes });
    }
    editorRef.current.innerHTML = "";
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };
  
  const handleCopy = (event, text) => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = text;
    const plainText = tempElement.textContent || tempElement.innerText;

    navigator.clipboard.writeText(plainText)
    .then(() => {
        const icon = event.target;
        icon.classList.add("copy-icon-green");
        setTimeout(() => {
          icon.classList.remove("copy-icon-green");
        }, 1000);
    })
    .catch(err => console.error("Error copying text: ", err));
  };

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
  };

  function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  
  function renderDetailedView() {
    const filteredNotes = notes.filter((note) => {
      const plainText = stripHtml(note.text).toLowerCase(); 
      return plainText.includes(searchQuery.toLowerCase());
    });
    if (filteredNotes.length === 0) {
      return <div className="text-center my-2"> No notes found. </div>;
    }
  
    return filteredNotes
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        if (sortOption === "date-desc") return new Date(b.date) - new Date(a.date);
        else if (sortOption === "date-asc") return new Date(a.date) - new Date(b.date);
        else if (sortOption === "alpha-asc") return stripHtml(a.text).localeCompare(stripHtml(b.text));
        else if (sortOption === "alpha-desc") return stripHtml(b.text).localeCompare(stripHtml(a.text));
        return 0;
      })
      .map((note) => (
        <div 
          className="note-item"
          key={note.id}
          onClick={() => setSelectedNote(note)}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <div className="note-text">
              {note.text.split(" ").slice(0, 2).join(" ")}
            </div>
            <span className="options" data-id={note.id}>
              <div className="icons">
                <i
                  className={`fa-solid ${note.pinned ? 'fa-thumbtack pinned' : 'fa-thumbtack'}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => togglePinNote(note.id)}
                  title={note.pinned ? "Unpin note" : "Pin note"}
                ></i>
                <i className="fas fa-trash delete-icon" onClick={() => deleteNote(note.id)}></i>
                <i className="fas fa-solid fa-pen" onClick={() => editNote(note.id, note.text)}></i>
                <i
                  className="fa-solid fa-copy copy-icon"
                  data-id={note.id}
                  onClick={(e) => handleCopy(e, note.text)}
                ></i>
              </div>
            </span>
          </div>
        </div>
      ));
  }


  function renderSimpleView() {
    const filteredNotes = notes.filter((note) => {
      const plainText = stripHtml(note.text).toLowerCase(); 
      return plainText.includes(searchQuery.toLowerCase());
    });
    if (filteredNotes.length === 0) {
      return <div className="text-center my-2"> No notes found. </div>;
    }
  
    return filteredNotes
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        if (sortOption === "date-desc") return new Date(b.date) - new Date(a.date);
        else if (sortOption === "date-asc") return new Date(a.date) - new Date(b.date);
        else if (sortOption === "alpha-asc") return stripHtml(a.text).localeCompare(stripHtml(b.text));
        else if (sortOption === "alpha-desc") return stripHtml(b.text).localeCompare(stripHtml(a.text));
        return 0;
      })
      .map((note) => (
        <div className="note-item" key={note.id}>
          <div>
            <div className="note-text" dangerouslySetInnerHTML={{ __html: note.text }}></div>
            <span className="options" data-id={note.id}>
              <small className="date">{formatDate(note.date)}</small>
              <div className="icons">
                <i
                  className={`fa-solid ${note.pinned ? 'fa-thumbtack pinned' : 'fa-thumbtack'}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => togglePinNote(note.id)}
                  title={note.pinned ? "Unpin note" : "Pin note"}
                ></i>
                <i className="fas fa-trash delete-icon" onClick={() => deleteNote(note.id)}></i>
                <i className="fas fa-solid fa-pen" onClick={() => editNote(note.id, note.text)}></i>
                <i
                  className="fa-solid fa-copy copy-icon"
                  data-id={note.id}
                  onClick={(e) => handleCopy(e, note.text)}
                ></i>
              </div>
            </span>
          </div>
        </div>
      ));
  }

  const togglePinNote = (id) => {
    const updatedNotes = notes.map((note) => 
      note.id === id ? { ...note, pinned: !note.pinned } : note
    );
    setNotes(updatedNotes);
    chrome.storage.local.set({ notes: updatedNotes });
  };
  
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
          <i className="fa-solid fa-bars" style={{ cursor: "pointer" }} onClick={openSettingsPage}></i>
        </div>
      </nav>

      {!detailedView ? (
          <div id="notes-list">{renderSimpleView()}</div>
        ) : (
        <div id="notes-list" className="row">
          <div className="col-4">
            {renderDetailedView()}
          </div>
          <div className="col-8">
            {selectedNote ? (
              <div>
                <h6>Note Preview</h6>
                <div dangerouslySetInnerHTML={{ __html: selectedNote.text }} />
              </div>
            ) : (
              <div>Select a note to see details</div>
            )}
          </div>

        </div>
      )}

      <RichTextEditor editorRef={editorRef} handleFormat={handleFormat} />

      <div className="position-relative pb-4 mb-1 pt-2">
        {error && (
          <div className="text-danger small">
            <i className="fa-solid fa-circle-info"></i>
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
    </div>
  );
}

const container = document.getElementById("popup-target");
const root = createRoot(container);
root.render(<Popup />);
