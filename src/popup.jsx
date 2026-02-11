import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";
import "./components/common_style.css"
import sanitizeHtml from "sanitize-html";
import RichTextEditor from "./components/RichText.jsx";
import { saveNote, deleteNoteById, handleCopy, editNoteById, togglePinNoteById, formatDate, stripHtml } from "./settings/utils/commonFunctions.js";

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

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript && editorRef.current) {
        editorRef.current.innerHTML += finalTranscript + " ";
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const openSettingsPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleFormat = (command) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
  
    const range = selection.getRangeAt(0);
    if (command === "code") {
      if (range.collapsed) return;
  
      const selectedText = range.toString();
      const isWrapped = selectedText.startsWith("`") && selectedText.endsWith("`");
      const newText = isWrapped
        ? selectedText.slice(1, -1)
        : "`" + selectedText + "`";
      const newNode = document.createTextNode(newText);
      range.deleteContents();
      range.insertNode(newNode);
      const newRange = document.createRange();
      newRange.setStart(newNode, 0);
      newRange.setEnd(newNode, newText.length);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      document.execCommand(command, false, null);
    }
  };
  
  function renderDetailedView() {
    const filteredNotes = notes.filter((note) => {
      const plainText = stripHtml(note.text).toLowerCase(); 

      if (note.deleted) return false;

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
      .map((note) => {
        const formatedText = note.text.replace(/`([^`]+)`/g, '<code class="inline-code highlight-code">$1</code>');
        return (
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
                  onClick={() => togglePinNoteById(note.id, notes, setNotes)}
                  title={note.pinned ? "Unpin note" : "Pin note"}
                ></i>
                <i className="fas fa-trash delete-icon" onClick={() => deleteNoteById(note.id, notes, setNotes)}></i>
                <i
                  className="fas fa-solid fa-pen"
                  onClick={() => editNoteById(note.id, note.text, setEditingId, setNote, editorRef)}
                ></i>
                <i
                className="fa-solid fa-copy copy-icon"
                data-id={note.id}
                onClick={(e) => handleCopy(e, note.text)}
              ></i>
              </div>
            </span>
          </div>
        </div>
      )});
  }


  function renderSimpleView() {
    const filteredNotes = notes.filter((note) => {
      const plainText = stripHtml(note.text).toLowerCase(); 
      if (note.deleted) return false;

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
      .map((note) => {
        const formatedText = note.text.replace(/`([^`]+)`/g, '<code class="inline-code highlight-code">$1</code>');
        return (
          <div className="note-item" key={note.id}>
            <div>
              <div className="note-text" dangerouslySetInnerHTML={{ __html: formatedText }}></div>
              <span className="options" data-id={note.id}>
                <small className="date">{formatDate(note.date)}</small>
                <div className="icons">
                  <i
                    className={`fa-solid ${note.pinned ? 'fa-thumbtack pinned' : 'fa-thumbtack'}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => togglePinNoteById(note.id, notes, setNotes)}
                    title={note.pinned ? "Unpin note" : "Pin note"}
                  ></i>
                  <i className="fas fa-trash delete-icon" onClick={() => deleteNoteById(note.id, notes, setNotes)}></i>
                  <i className="fas fa-solid fa-pen" onClick={() => editNoteById(note.id, note.text, setEditingId, setNote, editorRef)}></i>
                  <i
                    className="fa-solid fa-copy copy-icon"
                    data-id={note.id}
                    onClick={(e) => handleCopy(e, note.text)}
                  ></i>
                </div>
              </span>
            </div>
          </div>
        )});
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
                <div dangerouslySetInnerHTML={{ __html: selectedNote.text.replace(/`([^`]+)`/g, '<code class="inline-code highlight-code">$1</code>') }} />
              </div>
            ) : (
              <div>Select a note to see details</div>
            )}
          </div>

        </div>
      )}

      <RichTextEditor
        editorRef={editorRef}
        handleFormat={handleFormat}
        toggleVoiceInput={toggleVoiceInput}
        isListening={isListening}

      />

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
          onClick={() => {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
            setIsListening(false)
            saveNote(editorRef, notes, setNotes, editingId, setEditingId, setError)
          }
          }
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
