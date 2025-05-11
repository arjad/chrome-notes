import React, {useState, useEffect, useRef} from "react";
import sanitizeHtml from "sanitize-html";
import RichTextEditor from "../../components/RichText.jsx";

const NotesList = () => {
  const [viewMode, setViewMode] = useState("list");
  const [note, setNote] = useState({
    alarmTime: "",
    tag: "",
    url: "",
    pinned: false,
  });
  const [notes, setNotes] = useState([]);
  const [sortOption, setSortOption] = useState("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editorRef = useRef(null);
  const [error, setError] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [filters, setFilters] = useState({
    notesText: '',
    tag: "",
    pinned: "all",
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveFilters = () => {
    chrome.storage.local.set({ filters: filters });
  }

  useEffect(() => {
    chrome.storage.local.get(["notes", "settings", "filters"], (result) => {
      if (result.notes) {
        setNotes(result.notes);
      }
      if (result.settings?.sortOption) setSortOption(result.settings.sortOption);
      if (result.filters) setFilters(result.filters);
    });
  }, []);

  function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
    
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
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
      
      setIsNoteModalOpen(true);
    }
  };
  
  const daysArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const createWeeklyAlarm = (name, daysOfWeek, timeStr) => {
    if (!timeStr || timeStr === "") return;
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
    
    daysOfWeek.forEach(day => {
      const dayIndex = daysArray.indexOf(day);
      if (dayIndex === -1) return;
      const targetTime = new Date(now);
      const daysUntilTargetDay = (dayIndex - now.getDay() + 7) % 7;
      
      targetTime.setDate(now.getDate() + daysUntilTargetDay);
      targetTime.setHours(hours, minutes, 0, 0);
      
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 7);
      }
  
      console.log(`Creating alarm for ${day} at ${timeStr}, timestamp: ${targetTime.getTime()}`);
      chrome.alarms.create(`alarm_for${name}_${timeStr}_${day}`, {
        when: targetTime.getTime(),
        periodInMinutes: 10080 // 1 week
      });
    });
  }
  
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
    createWeeklyAlarm(Date.now().toString(), selectedDays, note.alarmTime); 
    closeNoteModal();
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

  const openFilterModal = () => {
    setIsFilterModalOpen(true);
  }

  const openNoteModal = () => {
    setIsNoteModalOpen(true);
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

  const closeNoteModal = () => {
    setIsNoteModalOpen(false);
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

  const togglePinNote = (id) => {
    const updatedNotes = notes.map((note) => 
      note.id === id ? { ...note, pinned: !note.pinned } : note
    );
    setNotes(updatedNotes);
    chrome.storage.local.set({ notes: updatedNotes });
  };
  const filterNote = (note) => {
    const plainText = stripHtml(note.text).toLowerCase();
  
    if (searchQuery && !plainText.includes(searchQuery.toLowerCase())) return false;
    if (filters.notesText && !plainText.includes(filters.notesText.toLowerCase())) return false;
    if (filters.tag && note.tag !== filters.tag) return false;
  
    if (filters.pinnedStatus === "pinned" && !note.pinned) return false;
    if (filters.pinnedStatus === "unpinned" && note.pinned) return false;
  
    if (filters.deletedStatus === "deleted" && !note.deleted) return false;
    if (filters.deletedStatus === "not_deleted" && note.deleted) return false;
  
    return true;
  };
  
  const sortNotes = (a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
  
    switch (sortOption) {
      case "date-desc": return new Date(b.date) - new Date(a.date);
      case "date-asc": return new Date(a.date) - new Date(b.date);
      case "alpha-asc": return stripHtml(a.text).localeCompare(stripHtml(b.text));
      case "alpha-desc": return stripHtml(b.text).localeCompare(stripHtml(a.text));
      default: return 0;
    }
  };
  
  const renderNoteIcons = (note) => (
    <div className="icons">
      <i className="fas fa-trash delete-icon" onClick={() => deleteNote(note.id)}></i>
      <i className="fas fa-solid fa-pen" onClick={() => editNote(note.id)}></i>
      <i className="fa-solid fa-copy copy-icon" data-id={note.id} onClick={(e) => handleCopy(e, note.text)}></i>
    </div>
  );
  
  const renderNotes = () => {
    const filteredNotes = notes.filter(filterNote).sort(sortNotes);
  
    if (viewMode === "grid") {
      return filteredNotes.map((note) => (
        <div className="note-item border-bottom position-relative" key={note.id}>
          {note.pinned && (
            <i
              className="fa-solid fa-thumbtack pinned"
              onClick={() => togglePinNote(note.id)}
              title="Unpin note"
            ></i>
          )}
          <span className="note-text d-inline" dangerouslySetInnerHTML={{ __html: note.text }}></span>
          {note.deleted && <span className="badge bg-danger m-lg-2">deleted</span>}
          <span className="options" data-id={note.id}>
            <small className="date">{formatDate(note.date)}</small>
            {renderNoteIcons(note)}
          </span>
        </div>
      ));
    }
  
    return (
      <table className="w-100">
        <thead>
          <tr className="border-bottom">
            <th>Note</th>
            <th>URL</th>
            <th>Tag</th>
            <th>Date</th>
            <th>Alarm Time</th>
            <th>Alarm Days</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredNotes.map((note) => (
            <tr key={note.id} className="position-relative py-2">
              <td>
                {note.pinned && (
                  <i
                    className="fa-solid fa-thumbtack pinned"
                    onClick={() => togglePinNote(note.id)}
                    title="Unpin note"
                  ></i>
                )}
                <span className="note-text d-inline" dangerouslySetInnerHTML={{ __html: note.text }}></span>
                {note.deleted && <span className="badge bg-danger m-lg-2">deleted</span>}
              </td>
              <td>{note.url && <span>{note.url}</span>}</td>
              <td>{note.tag && <span className="badge bg-secondary">{note.tag}</span>}</td>
              <td>{formatDate(note.date)}</td>
              <td>
                {note.alarmTime && (
                  <span>
                    {new Date(`1970-01-01T${note.alarmTime}:00`).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                )}
              </td>
              <td>
                {Array.isArray(note.alarmDays) && (
                  <div className="flex flex-wrap gap-2">
                    {note.alarmDays.map((day, index) => (
                      <span
                        key={index}
                        className="rounded-5 border p-1 small text-muted mx-1"
                      >
                        {day[0]}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td>{renderNoteIcons(note)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  const toggleDay = (day) => {
    let updatedDays;
    if (selectedDays.includes(day)) {
      updatedDays = selectedDays.filter(d => d !== day);
    } else {
      updatedDays = [...selectedDays, day];
    }
  
    // Sort according to daysArray
    updatedDays.sort((a, b) => daysArray.indexOf(a) - daysArray.indexOf(b));
    setSelectedDays(updatedDays);
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
            <button 
              className="btn btn-outline-primary btn-sm flex-sm-shrink-0"
              onClick={openFilterModal}
            >
              <i class="fa-solid fa-filter me-2"></i>
              Filters
            </button>
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
              onClick={openNoteModal}
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
              onClick={openNoteModal}
            >
              <i className="fas fa-plus me-2"></i>
              Create Note
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <div className={`filter-modal offcanvas offcanvas-end ${isFilterModalOpen ? 'show' : ''}`} tabIndex="-1">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Filters</h5>
          <button type="button" className="btn" onClick={() => setIsFilterModalOpen(false)}>
            <i className="fa-solid fa-x"></i>
          </button>
        </div>
        <div className="offcanvas-body">
          <div>
            <label htmlFor="notes-text" className="form-label">Notes text:</label>
            <input 
              type="text"
              className="form-control" 
              value={filters.notesText}
              onChange={(e) => handleFilterChange('notesText', e.target.value)}
            />
          </div>

          <div className="mt-2">
            <label htmlFor="tag" className="form-label">Notes tag:</label>
            <input 
              type="text" 
              className="form-control" 
              value={filters.tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
            />
          </div>

          <div className="mt-2">
            <label className="form-label">Pinned status:</label>
            <select 
              className="form-select"
              value={filters.pinnedStatus}
              onChange={(e) => handleFilterChange('pinnedStatus', e.target.value)}
            >
              <option value="both">Both</option>
              <option value="pinned">Pinned</option>
              <option value="unpinned">Unpinned</option>
            </select>
          </div>

          <div className="mt-2">
            <label className="form-label">Deleted status:</label>
            <select 
              className="form-select"
              value={filters.deletedStatus}
              onChange={(e) => handleFilterChange('deletedStatus', e.target.value)}
            >
              <option value="both">Both</option>
              <option value="deleted">Deleted</option>
              <option value="not_deleted">Not Deleted</option>
            </select>
          </div>
          <button className="btn btn-primary mt-3" onClick={saveFilters}>Apply Filters</button>
        </div>
      </div>



      {/* Note Modal */}
      <div className={`newnote-modal modal border fade ${isNoteModalOpen ? 'show d-block' : ''}`} 
        tabIndex="-1" 
        role="dialog"
        aria-labelledby="noteModalLabel"
        aria-hidden={!isNoteModalOpen}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content w-100">
            <div className="modal-header">
              <h5 className="modal-title" id="noteModalLabel">{editingId ? "Edit Note" : "New Note"}</h5>
              <button type="button" className="btn" onClick={closeNoteModal}>
                <i class="fa-solid fa-x"></i>
              </button>
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
                    {daysArray.map((day, index) => (
                      <div 
                        key={day} 
                        className="py-1 px-2 cursor-pointer rounded-5 text-center"
                        onClick={() => toggleDay(day)}
                        style={selectedDays.includes(day) ? { backgroundColor: '#684993', color: 'white' } : {}}
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
              <button type="button" className="btn btn-secondary" onClick={closeNoteModal}>
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