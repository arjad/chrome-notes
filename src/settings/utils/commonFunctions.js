const sanitizeHtml = require("sanitize-html");

const saveNote = (editorRef, notes, setNotes, editingId, setEditingId, setError) => {
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

const deleteNoteById = (id, notes, setNotes) => {
  const updatedNotes = notes.filter((note) => note.id !== id);
  setNotes(updatedNotes);
  chrome.storage.local.set({ notes: updatedNotes });
};

function handleCopy(event, text) {
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
}

function editNoteById(id, text, setEditingId, setNote, editorRef) {
  setEditingId(id);
  setNote(text);
  if (editorRef.current) {
    editorRef.current.innerHTML = text;
  }
}

const togglePinNoteById = (id, notes, setNotes) => {
  const updatedNotes = notes.map((note) =>
    note.id === id ? { ...note, pinned: !note.pinned } : note
  );
  setNotes(updatedNotes);
  chrome.storage.local.set({ notes: updatedNotes });
};

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

const handleSearchChange = (e) => {
  setSearchQuery(e.target.value.toLowerCase());
};

module.exports = {
  saveNote,
  deleteNoteById,
  handleCopy,
  editNoteById,
  togglePinNoteById,
  formatDate,
  stripHtml,
  handleSearchChange
};
