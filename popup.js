document.addEventListener("DOMContentLoaded", () => {
  const noteInput = document.getElementById("note-input");
  const saveBtn = document.getElementById("save-btn");
  const notesList = document.getElementById("notes-list");
  const errorMsg = document.querySelector(".error-msg");
  const deleteModal = document.getElementById("delete-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  let noteIdToDelete = null;

  // Load Notes on Page Load
  loadNotes();

  // Save Note
  saveBtn.addEventListener("click", () => {
    const noteText = noteInput.value.trim();
    if (!noteText) {
      errorMsg.style.display = "inline";
      return;
    }
    errorMsg.style.display = "none";

    chrome.storage.sync.get(["notes"], (result) => {
      const notes = result.notes || [];
      const newNote = {
        id: Date.now(),
        text: noteText,
        date: new Date().toISOString(),
        pinned: false,
        pinnedAt: null,
      };

      chrome.storage.sync.set({ notes: [...notes, newNote] }, () => {
        noteInput.value = "";
        loadNotes();
      });
    });
  });

  // Load Notes
  function loadNotes() {
    chrome.storage.sync.get(["notes", "sort_value"], (result) => {
      const notes = result.notes || [];
      const sortVal = result.sort_value || "date-desc";

      const pinnedNotes = notes.filter((n) => n.pinned).sort((a, b) => b.pinnedAt - a.pinnedAt);
      const unpinnedNotes = notes.filter((n) => !n.pinned);

      unpinnedNotes.sort((a, b) => {
        if (sortVal === "alpha-asc") return a.text.localeCompare(b.text);
        if (sortVal === "alpha-desc") return b.text.localeCompare(a.text);
        if (sortVal === "date-asc") return new Date(a.date) - new Date(b.date);
        return new Date(b.date) - new Date(a.date);
      });

      const sortedNotes = [...pinnedNotes, ...unpinnedNotes];
      notesList.innerHTML = sortedNotes.map(generateNoteHTML).join("");
      attachEventListeners();
    });
  }

  // Generate Note HTML
  function generateNoteHTML(note) {
    return `
      <div class="note-item">
        <div>
          <div class="note-text">${note.text}</div>
          <span class="options" data-id="${note.id}">
            <small class="date">${new Date(note.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</small>
            <div class="icons">
              <i class="fas fa-thumbtack pin-icon" data-id="${note.id}" style="color: ${
                note.pinned ? "#ffc107" : "#6c757d"
              };"></i>
              <i class="fas fa-trash delete-icon" data-id="${note.id}"></i>
              <i class="fa-solid fa-copy copy-icon" data-id="${note.id}"></i>
            </div>
          </span>
        </div>
      </div>`;
  }

  // Attach Event Listeners
  function attachEventListeners() {
    document.querySelectorAll(".pin-icon").forEach((icon) =>
      icon.addEventListener("click", () => togglePin(parseInt(icon.dataset.id)))
    );

    document.querySelectorAll(".delete-icon").forEach((icon) =>
      icon.addEventListener("click", () => {
        noteIdToDelete = parseInt(icon.dataset.id);
        deleteModal.style.display = "flex";
      })
    );

    document.querySelectorAll(".copy-icon").forEach((icon) =>
      icon.addEventListener("click", () => copyNoteText(parseInt(icon.dataset.id), icon))
    );
  }

  // Toggle Pin Status
  function togglePin(noteId) {
    chrome.storage.sync.get(["notes"], (result) => {
      const notes = result.notes || [];
      const updatedNotes = notes.map((note) =>
        note.id === noteId
          ? { ...note, pinned: !note.pinned, pinnedAt: note.pinned ? null : Date.now() }
          : note
      );
      chrome.storage.sync.set({ notes: updatedNotes }, loadNotes);
    });
  }

  // Copy Note Text
  function copyNoteText(noteId, icon) {
    chrome.storage.sync.get(["notes"], (result) => {
      const note = result.notes.find((n) => n.id === noteId);
      if (note) {
        navigator.clipboard.writeText(note.text).then(() => {
          icon.style.color = "#28a745";
          setTimeout(() => (icon.style.color = ""), 1000);
        });
      }
    });
  }

  // Delete Note
  confirmDeleteBtn.addEventListener("click", () => {
    chrome.storage.sync.get(["notes"], (result) => {
      const notes = result.notes.filter((note) => note.id !== noteIdToDelete);
      chrome.storage.sync.set({ notes }, () => {
        loadNotes();
        deleteModal.style.display = "none";
      });
    });
  });

  cancelDeleteBtn.addEventListener("click", () => (deleteModal.style.display = "none"));

  // Open Settings Page
  document.querySelector(".fa-gear").addEventListener("click", () => {
    chrome.tabs.create({ url: "setting/settings.html" });
  });

  // Apply Dark Mode
  chrome.storage.sync.get("darkMode", (data) => {
    if (data.darkMode) document.body.classList.add("dark-mode");
  });

  // Search Notes
  document.getElementById("search-input").addEventListener("input", (e) => {
    const searchText = e.target.value.toLowerCase();
    document.querySelectorAll(".note-item").forEach((note) => {
      note.style.display = note.querySelector(".note-text").textContent.toLowerCase().includes(searchText)
        ? "block"
        : "none";
    });
  });


  // pop up resizing
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "resizePopup") {
      document.body.setAttribute("data-size", message.size);
    }
  });
  chrome.storage.sync.get("popupSize", function (data) {
    if (data.popupSize) {
      document.body.setAttribute("data-size", data.popupSize);
    }
  });

});
