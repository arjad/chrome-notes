import React, {useState, useEffect} from "react";

const NotesList = () => {
  const [viewMode, setViewMode] = useState("list");
  const [notes, setNotes] = useState([]);
  const [sortOption, setSortOption] = useState("date-desc");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["notes", "settings"], (result) => {
      if (result.notes) {
        setNotes(result.notes);
      }
      if (result.settings?.sortOption) setSortOption(result.settings.sortOption);
    });
  }, []);

    const openAlarmModal = (id) => {
      console.log("Opening modal for note ID:", id);
      setAlarmNoteId(id);
      setIsAlarmModalOpen(true);
    };
    
    function stripHtml(html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.body.textContent || "";
    }
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
  
    const handleSortOptionChange = (e) => {
      const value = e.target.value;
      setSortOption(value);
      chrome.storage.local.get(["settings"], (result) => {
        const updatedSettings = { ...result.settings, sortOption: value };
        chrome.storage.local.set({ settings: updatedSettings });
      });
    };

  const handleClearFilters = () => {
    setSearchText("");
    setDateRange({ from: "", to: "" });
    setSelectedTags([]);
    setStatusFilter({ active: true, archived: false });
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
            <button className="btn btn-primary btn-sm flex-sm-shrink-0">
              <i className="fas fa-plus me-2"></i>
              New Note
            </button>
          </div>
        </div>
      </div>

      {/* Notes Grid/List View */}
      <div className={`notes-container p-3 ${viewMode}-view`}>
        {notes.length > 0 ? (
          notes.filter((note) => {
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
                <div className="icons">
                  <i
                    className="fa-solid fa-clock"
                    style={{ cursor: "pointer" }}
                    onClick={() => openAlarmModal(note.id)}
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
          ))
        ) : (
          <div className="notes-empty text-center p-4">
            <div className="empty-illustration">
              <i className="far fa-sticky-note"></i>
            </div>
            <h5>No Notes Found</h5>
            <p className="text-muted">
              Create your first note to get started!
            </p>
            <button className="btn btn-primary btn-sm">
              <i className="fas fa-plus me-2"></i>
              Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesList;
