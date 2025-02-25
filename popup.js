document.addEventListener("DOMContentLoaded", function () {
  const noteInput = document.getElementById("note-input");
  const saveBtn = document.getElementById("save-btn");
  const notesList = document.getElementById("notes-list");
  const errorMsg = document.querySelector(".error-msg");
  const deleteModal = new bootstrap.Modal(
    document.getElementById("delete-modal")
  );
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  let noteIdToDelete = null;

  // Load existing notes
  loadNotes();

  // Save note function
  function saveNote(noteText) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(["notes"], function (result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const notes = result.notes || [];
        const newNote = {
          id: Date.now(),
          text: noteText,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        };

        chrome.storage.sync.set({ notes: [...notes, newNote] }, function () {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      });
    });
  }

  // Save button click handler
  saveBtn.addEventListener("click", async function () {
    const noteText = noteInput.value.trim();
    if (noteText) {
      errorMsg.style.display = "none";
      try {
        await saveNote(noteText);
        noteInput.value = "";
        loadNotes();
      } catch (error) {
        errorMsg.textContent = "Failed to save note. Please try again.";
        errorMsg.style.display = "block";
        console.error("Error saving note:", error);
      }
    } else {
      errorMsg.style.display = "block";
    }
  });

  // Load and display notes
  function loadNotes() {
    chrome.storage.sync.get(["notes", "sort_value"], function (result) {
      const notes = result.notes || [];
      const sort_val = result.sort_value || "date-desc";

      let sortedNotes = [...notes];
      if (sort_val === "alpha-asc") {
        sortedNotes.sort((a, b) => a.text.localeCompare(b.text));
      } else if (sort_val === "alpha-desc") {
        sortedNotes.sort((a, b) => b.text.localeCompare(a.text));
      } else if (sort_val === "date-asc") {
        sortedNotes.sort((a, b) => new Date(a.date) - new Date(b.date));
      } else if (sort_val === "date-desc") {
        sortedNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      notesList.innerHTML = "";
      sortedNotes.forEach(function (note) {
        const noteElement = document.createElement("div");
        noteElement.className = "card mb-2";
        noteElement.innerHTML = `
          <div class="card-body py-2">
            <div class="note-text mb-2">${note.text}</div>
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">${note.date}</small>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary copy-btn" data-id="${note.id}">
                  <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${note.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        notesList.appendChild(noteElement);
      });

      // Add delete handlers
      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          noteIdToDelete = parseInt(this.dataset.id);
          deleteModal.show();
        });
      });

      // Add copy handlers
      document.querySelectorAll(".copy-btn").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const noteId = parseInt(this.dataset.id);
          const note = notes.find((n) => n.id === noteId);
          if (note) {
            try {
              await navigator.clipboard.writeText(note.text);
              this.classList.remove("btn-outline-primary");
              this.classList.add("btn-success");
              setTimeout(() => {
                this.classList.remove("btn-success");
                this.classList.add("btn-outline-primary");
              }, 1000);
            } catch (err) {
              console.error("Failed to copy text: ", err);
            }
          }
        });
      });
    });
  }

  // Delete confirmation
  confirmDeleteBtn.addEventListener("click", function () {
    chrome.storage.sync.get(["notes"], function (result) {
      const notes = result.notes || [];
      const filteredNotes = notes.filter((note) => note.id !== noteIdToDelete);
      chrome.storage.sync.set({ notes: filteredNotes }, function () {
        loadNotes();
        deleteModal.hide();
      });
    });
  });

  // Settings icon click
  document.querySelector(".fa-gear").addEventListener("click", function () {
    chrome.tabs.create({ url: "setting/settings.html" });
  });

  // Dark mode check
  chrome.storage.sync.get("darkMode", function (data) {
    if (data.darkMode) {
      document.body.classList.add("dark-mode");
    }
  });

  // Search with debounce
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener(
    "input",
    debounce(function () {
      const searchText = this.value.toLowerCase();
      document.querySelectorAll(".card").forEach((note) => {
        const noteText = note
          .querySelector(".note-text")
          .textContent.toLowerCase();
        note.style.display = noteText.includes(searchText) ? "block" : "none";
      });
    }, 300)
  );
});

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
