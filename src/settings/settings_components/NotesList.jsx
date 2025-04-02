import React, {useState, useEffect, useRef} from "react";
import sanitizeHtml from "sanitize-html";
import RichTextEditor from "../../components/RichText.jsx";

const NotesList = () => {
  const [viewMode, setViewMode] = useState("list");
  const [note, setNote] = useState({
    alarmTime: "",
    tag: "",
    url: "",
    pinned: false
  });
  const [notes, setNotes] = useState([]);
  const [sortOption, setSortOption] = useState("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editorRef = useRef(null);
  const [error, setError] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    chrome.storage.local.get(["notes", "settings"], (result) => {
      if (result.notes) {
        setNotes(result.notes);
      }
      if (result.settings?.sortOption) setSortOption(result.settings.sortOption);
    });
  }, []);

  function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
    
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };
  
  const deleteNote = (id) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    chrome.storage.local.set({ notes: updatedNotes });
  };
  
  const editNote = (id) => {
    const noteToEdit = notes.find((note) => note.id === id);
    if (noteToEdit) {
      setEditingId(id);
      setNote({
        alarmTime: noteToEdit.alarmTime || "",
        tag: noteToEdit.tag || "",
        url: noteToEdit.url || "",
        pinned: noteToEdit.pinned || false
      });
      setSelectedDays(noteToEdit.alarmDays || []);
      
      if (editorRef.current) {
        editorRef.current.innerHTML = noteToEdit.text;
      }
      
      setIsNewNoteModalOpen(true);
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
        n.id === editingId
          ? { 
              ...n, 
              text: sanitizedHtml, 
              date: new Date().toISOString(), 
              alarmTime: note.alarmTime,
              alarmDays: selectedDays,
              tag: note.tag, 
              url: note.url, 
              pinned: note.pinned 
            }
          : n
      );
      setNotes(updatedNotes);
      chrome.storage.local.set({ notes: updatedNotes });
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now().toString(),
        text: sanitizedHtml,
        date: new Date().toISOString(),
        alarmDays: selectedDays,
        alarmTime: note.alarmTime,
        tag: note.tag,
        url: note.url,
        pinned: note.pinned,
      };
  
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      chrome.storage.local.set({ notes: updatedNotes });
    }
    
    closeNewNoteModal();
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

  const handleSortOptionChange = (e) => {
    const value = e.target.value;
    setSortOption(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, sortOption: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });
  };

  const openNewNoteModal = () => {
    setIsNewNoteModalOpen(true);
    setEditingId(null);
    // Clear the editor when opening for a new note
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setNote({
      alarmTime: "",
      tag: "",
      url: "",
      pinned: false,
    });
    setSelectedDays([]);
  };

  const closeNewNoteModal = () => {
    setIsNewNoteModalOpen(false);
    setEditingId(null);
    setError("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setSelectedDays([]);
    setNote({
      alarmTime: "",
      tag: "",
      url: "",
      pinned: false,
    });
  };

  const handleNoteChange = (key, value) => {
    setNote({
      ...note,
      [key]: value
    });
  };

  const renderNotes = () => {
    return notes
      .filter((note) => {
        const plainText = stripHtml(note.text).toLowerCase(); 
        return plainText.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        if (sortOption === "date-desc") return new Date(b.date) - new Date(a.date);
        else if (sortOption === "date-asc") return new Date(a.date) - new Date(b.date);
        else if (sortOption === "alpha-asc") return stripHtml(a.text).localeCompare(stripHtml(b.text));
        else if (sortOption === "alpha-desc") return stripHtml(b.text).localeCompare(stripHtml(a.text));
        return 0;
      })
      .map((note) => (
        <div className="note-item border-bottom" key={note.id}>
          <div className="note-text" dangerouslySetInnerHTML={{ __html: note.text }}></div>
          <span className="options" data-id={note.id}>
            <small className="date">{formatDate(note.date)}</small>
            {note.alarmTime && <span>{note.alarmTime}</span>}
            {note.tag && <span>{note.tag}</span>}
            {note.url && typeof note.url === 'string' && <span>{note.url}</span>}
            {<span>{note.pinned ? "true" : "false"}</span>}
            {note.alarmDays && Array.isArray(note.alarmDays) && <span>{note.alarmDays.join(", ")}</span>}

            <div className="icons">
              <i className="fas fa-trash delete-icon" onClick={() => deleteNote(note.id)}></i>
              <i className="fas fa-solid fa-pen" onClick={() => editNote(note.id)}></i>
              <i
                className="fa-solid fa-copy copy-icon"
                data-id={note.id}
                onClick={(e) => handleCopy(e, note.text)}
              ></i>
            </div>
          </span>
        </div>
      ));
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  const handleFormat = (command) => {
    document.execCommand(command, false, null);
  };

  return (
    <div className="notes-view card border-1">
      <div className="notes-header mb-4 p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="search-bar">
            <div className="input-group">
              <span className="input-group-text border bg-transparent">
                <i className="fas fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border"
                placeholder="Search notes..."
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="d-flex gap-3 align-items-center">
            <div className="view-toggle btn-group">
              <button
                className={`btn btn-sm flex-xxl-shrink-0 ${ viewMode === "grid" ? "btn-primary" : "btn-outline-primary" }`}
                onClick={() => setViewMode("grid")}
              >
                <i className="fas fa-th-large me-2"></i>
                Grid
              </button>
              <button
                className={`btn btn-sm flex-xxl-shrink-0 ${ viewMode === "list" ? "btn-primary" : "btn-outline-primary" }`}
                onClick={() => setViewMode("list")}
              >
                <i className="fas fa-list me-2"></i>
                List
              </button>
            </div>
            <select
              value={sortOption}
              onChange={handleSortOptionChange}
            >
              <option value="date-desc">Latest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="alpha-asc">A to Z</option>
              <option value="alpha-desc">Z to A</option>
            </select>
            <button 
              className="btn btn-primary btn-sm flex-sm-shrink-0"
              onClick={openNewNoteModal}
            >
              <i className="fas fa-plus me-2"></i>
              New Note
            </button>
          </div>
        </div>
      </div>

      {/* Notes Grid/List View */}
      <div className={`notes-container p-3 ${viewMode}-view`}>
        {notes.length > 0 ? (
          renderNotes()
        ) : (
          <div className="notes-empty text-center p-4">
            <div className="empty-illustration">
              <i className="far fa-sticky-note"></i>
            </div>
            <h5>No Notes Found</h5>
            <p className="text-muted">
              Create your first note to get started!
            </p>
            <button 
              className="btn btn-primary btn-sm"
              onClick={openNewNoteModal}
            >
              <i className="fas fa-plus me-2"></i>
              Create Note
            </button>
          </div>
        )}
      </div>

      {/* Bootstrap Modal */}
      <div className={`modal border fade ${isNewNoteModalOpen ? 'show d-block' : ''}`} 
        id="noteModal" 
        tabIndex="-1" 
        role="dialog"
        aria-labelledby="noteModalLabel"
        aria-hidden={!isNewNoteModalOpen}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content w-100">
            <div className="modal-header">
              <h5 className="modal-title" id="noteModalLabel">{editingId ? "Edit Note" : "New Note"}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={closeNewNoteModal}></button>
            </div>
            <div className="modal-body">
              <RichTextEditor 
                editorRef={editorRef} handleFormat={handleFormat}
                className="form-control"
                contentEditable="true"
                style={{ minHeight: "200px" }}
                placeholder="Write your note here..."
              />
              
              <div className="row mt-3">
                <div className="col-5">
                  <label htmlFor="alarm-time" className="form-label">Alarm Time:</label>
                  <input 
                    type="time" 
                    id="alarm-time" 
                    name="alarm-time" 
                    className="form-control" 
                    value={note.alarmTime}
                    onChange={(e) => handleNoteChange('alarmTime', e.target.value)}
                  />
                </div>
                <div className="col-7">
                  <label className="form-label">Days of the Week:</label>
                  <div className="d-flex justify-content-between alarm-days">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                      <div 
                        key={day} 
                        className="border py-1 px-2 cursor-pointer"
                        onClick={() => toggleDay(day)}
                        style={selectedDays.includes(day) ? { backgroundColor: '#8A2BE2', color: 'white' } : {}}
                      >
                        {day[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor="url" className="form-label">Show on which webpage (URL):</label>
                <input 
                  type="url" 
                  id="url" 
                  name="url" 
                  value={note.url} 
                  className="form-control" 
                  onChange={(e) => handleNoteChange('url', e.target.value)}
                />
              </div>
              
              <div className="row mt-3">
                <div className="col-md-6">
                  <label htmlFor="tag" className="form-label">Tag:</label>
                  <input 
                    type="text" 
                    id="tag"
                    className="form-control"
                    value={note.tag}
                    onChange={(e) => handleNoteChange('tag', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <input 
                    className="form-check-input m-1" 
                    type="checkbox" 
                    checked={note.pinned} 
                    id="pin" 
                    onChange={(e) => handleNoteChange('pinned', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="pin">
                    Pin Note
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {error && <div className="text-danger">{error}</div>}
              <button type="button" className="btn btn-secondary" onClick={closeNewNoteModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveNote}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NotesList;