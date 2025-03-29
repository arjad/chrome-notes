import React, {useState, useEffect} from "react";

const NotesList = () => {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [notes, setNotes] = useState([]);
  
  useEffect(() => {
      chrome.storage.local.get(["notes", "settings"], (result) => {
      if (result.notes) {
          setNotes(result.notes);
      }
      });
  }, []);

  const handleClearFilters = () => {
    setSearchText("");
    setDateRange({ from: "", to: "" });
    setSelectedTags([]);
    setStatusFilter({ active: true, archived: false });
  };

  return (
    <div className="notes-view">
      <div className="notes-header card border-1 mb-4">
        <div className="card-body p-3">
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
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="d-flex gap-3 align-items-center">
              <div className="view-toggle btn-group">
                <button
                  className={`btn btn-sm ${ viewMode === "grid" ? "btn-primary" : "btn-outline-primary" }`}
                  onClick={() => setViewMode("grid")}
                >
                  <i className="fas fa-th-large me-2"></i>
                  Grid
                </button>
                <button
                  className={`btn btn-sm ${ viewMode === "list" ? "btn-primary" : "btn-outline-primary" }`}
                  onClick={() => setViewMode("list")}
                >
                  <i className="fas fa-list me-2"></i>
                  List
                </button>
              </div>
              <select className="form-select form-select-sm border" >
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
      </div>

      {/* Notes Grid/List View */}
      <div className={`notes-container ${viewMode}-view`}>
        {notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-card-header">
                <div className="note-meta">
                  <div className="note-date">
                    <i className="far fa-clock me-1"></i>
                    {new Date(note.date).toLocaleDateString()}
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="note-tags">
                      {note.tags.map((tag) => (
                        <span key={tag} className="note-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dropdown">
                  <button className="btn-icon" data-bs-toggle="dropdown">
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button className="dropdown-item">
                        <i className="fas fa-edit me-2"></i>
                        Edit
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        <i className="fas fa-archive me-2"></i>
                        Archive
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item text-danger">
                        <i className="fas fa-trash-alt me-2"></i>
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="note-title">
                {note.title || "Untitled Note"}
              </div>
              <div className="note-content">{note.content}</div>
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
