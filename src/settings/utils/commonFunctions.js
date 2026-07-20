const sanitizeHtml = require("sanitize-html");

const saveNote = (editorRef, notes, setNotes, editingId, setEditingId, setError) => {
  if (editorRef.current.innerHTML.trim() === "") {
    setError("Please enter a note.");
    return;
  }
  setError("");

  let sanitizedHtml = sanitizeHtml(editorRef.current.innerHTML, {
    allowedTags: ["b", "i", "u", "p", "br", "strong", "em", "ul", "ol", "li", "div"],
    allowedAttributes: {},
  });
  sanitizedHtml = sanitizedHtml.replace(/&nbsp;/g, ' ').replace(/&amp;nbsp;/g, ' ');

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
  const updatedNotes = notes.map((note) =>
    note.id === id ? { ...note, deleted: !note.deleted } : note
  );
  setNotes(updatedNotes);
  chrome.storage.local.set({ notes: updatedNotes });
};

const permanentlyDeleteNoteById = (id, notes, setNotes) => {
  const updatedNotes = notes.filter(note => note.id !== id);
  setNotes(updatedNotes);
  chrome.storage.local.set({ notes: updatedNotes });
};

function handleCopy(event, text) {
  let formattedText = text.replace(/<br\s*[\/]?>/gi, '\n')
                          .replace(/<\/p>|<\/div>|<\/li>/gi, '\n')
                          .replace(/&nbsp;/g, ' ')
                          .replace(/&amp;nbsp;/g, ' ');
  const tempElement = document.createElement("div");
  tempElement.innerHTML = formattedText;
  let plainText = (tempElement.textContent || tempElement.innerText).trim();
  plainText = plainText.replace(/\u00A0/g, ' ');

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
  permanentlyDeleteNoteById,
  handleCopy,
  editNoteById,
  togglePinNoteById,
  formatDate,
  stripHtml,
  handleSearchChange
};
