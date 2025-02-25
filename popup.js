document.addEventListener('DOMContentLoaded', function() {
  const noteInput = document.getElementById('note-input');
  const saveBtn = document.getElementById('save-btn');
  const notesList = document.getElementById('notes-list');
  const errorMsg = document.getElementsByClassName('error-msg')[0];
  const deleteModal = document.getElementById('delete-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  let noteIdToDelete = null;

  // Load existing notes
  loadNotes();

  // Save note
  saveBtn.addEventListener('click', function() {
    const noteText = noteInput.value.trim();
    if (noteText) {
      errorMsg.style.display = "none";
      chrome.storage.sync.get(['notes'], function(result) {
        const notes = result.notes || [];
        const newNote = {
          id: Date.now(),
          text: noteText,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          pinned: false, // Default to unpinned
          pinnedAt: null // No timestamp initially
        };
        notes.push(newNote);
        chrome.storage.sync.set({ notes: notes }, function() {
          noteInput.value = '';
          loadNotes();
        });
      });
    } else {
      errorMsg.style.display = "block";
    }
  });

  // Load and display notes
  function loadNotes() {
main
    chrome.storage.sync.get(['notes', 'sort_value'], function(result) {
      const notes = result.notes || [];
      const sort_val = result.sort_value || 'date-desc';

      // Separate pinned and unpinned notes
      const pinnedNotes = notes.filter(note => note.pinned);
      const unpinnedNotes = notes.filter(note => !note.pinned);

      // Sort pinned notes by pinnedAt timestamp (newest first)
      pinnedNotes.sort((a, b) => b.pinnedAt - a.pinnedAt);

      // Sort unpinned notes based on the selected criteria
      if (sort_val === "alpha-asc") {
        unpinnedNotes.sort((a, b) => a.text.localeCompare(b.text)); // A-Z
      } else if (sort_val === "alpha-desc") {
        unpinnedNotes.sort((a, b) => b.text.localeCompare(a.text)); // Z-A
      } else if (sort_val === "date-asc") {
        unpinnedNotes.sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest to Newest
      } else if (sort_val === "date-desc") {
        unpinnedNotes.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest to Oldest
      }

      // Combine pinned and sorted unpinned notes
      const sortedNotes = [...pinnedNotes, ...unpinnedNotes];

      // Render the notes
      notesList.innerHTML = '';
      sortedNotes.forEach(function(note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `<div>
          <div class="note-text">${note.text}</div>
          <span class="options" data-id="${note.id}">
            <small class="date">${note.date}</small>
            <div class="icons">
              <i class="fas fa-thumbtack pin-icon" data-id="${note.id}" style="color: ${note.pinned ? '#ffc107' : '#6c757d'};"></i>
              <i class="fas fa-trash delete-icon" data-id="${note.id}"></i>
              <i class="fa-solid fa-copy copy-icon" data-id="${note.id}"></i>
            </div>
          </span>
        </div>`;
        notesList.appendChild(noteElement);
      });
    chrome.storage.sync.get(['notes', 'sort_value'], function(result) {
      const notes = result.notes || [];
      const sort_val = result.sort_value || 'date-desc'; // Default sorting if not set
      console.log('Stored sorting value:', sort_val);

        let sortedNotes = [...notes]; // Create a copy to avoid modifying the original
        if (sort_val === "alpha-asc") {
            sortedNotes.sort((a, b) => a.text.localeCompare(b.text)); // A-Z
        } else if (sort_val === "alpha-desc") {
            sortedNotes.sort((a, b) => b.text.localeCompare(a.text)); // Z-A
        } else if (sort_val === "date-asc") {
            sortedNotes.sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest to Newest
        } else if (sort_val === "date-desc") {
            sortedNotes.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest to Oldest
        }

        notesList.innerHTML = '';
        sortedNotes.forEach(function(note) {
          const noteElement = document.createElement('div');
          noteElement.className = 'note-item';
          noteElement.innerHTML = `<div>
            <div class="note-text">${note.text}</div>
              <span class="options" data-id="${note.id}">
                <small class="date">${note.date}</small>
                <div class="icons">
                  <i class="fas fa-trash delete-icon" data-id="${note.id}"></i>
                  <i class="fa-solid fa-copy copy-icon" data-id="${note.id}"></i>
                </div>
              </span>
            </div>`;
          notesList.appendChild(noteElement);
        });
main

      // Add pin functionality
      document.querySelectorAll('.pin-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          const noteId = parseInt(this.getAttribute('data-id'));
          togglePin(noteId);
        });
      });

      // Add delete functionality
      document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          noteIdToDelete = parseInt(this.getAttribute('data-id'));
          deleteModal.style.display = 'flex';
        });
      });

      // Add copy functionality
      document.querySelectorAll('.copy-icon').forEach(icon => {
        icon.addEventListener('click', async function() {
          const noteId = parseInt(this.getAttribute('data-id'));
          const note = notes.find(n => n.id === noteId);
          if (note) {
            try {
              await navigator.clipboard.writeText(note.text);
              const originalColor = this.style.color;
              this.style.color = '#28a745'; // Change to green
              setTimeout(() => {
                this.style.color = originalColor;
              }, 1000);
            } catch (err) {
              console.error('Failed to copy text: ', err);
            }
          }
        });
      });
    });
  }

  // Toggle pin status
  function togglePin(noteId) {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          // Toggle the pinned status and set pinnedAt timestamp
          const isPinned = !note.pinned;
          return { 
            ...note, 
            pinned: isPinned,
            pinnedAt: isPinned ? Date.now() : null // Set timestamp if pinned, otherwise null
          };
        }
        return note;
      });
      chrome.storage.sync.set({ notes: updatedNotes }, function() {
        loadNotes(); // Reload notes to reflect the changes
      });
    });
  }

  // Delete note
  function deleteNote() {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      const filteredNotes = notes.filter(note => note.id !== noteIdToDelete);
      chrome.storage.sync.set({ notes: filteredNotes }, function() {
        loadNotes();
        deleteModal.style.display = 'none';
      });
    });
  }

  // Handle modal actions
  confirmDeleteBtn.addEventListener('click', function() {
    deleteNote();
  });

  cancelDeleteBtn.addEventListener('click', function() {
    deleteModal.style.display = 'none';
  });

  // Open settings
  const settingsIcon = document.querySelector('.fa-gear');
  settingsIcon.addEventListener('click', function() {
    chrome.tabs.create({ url: 'setting/settings.html' });
  });

  // Check for dark mode setting
  chrome.storage.sync.get('darkMode', function (data) {
    if (data.darkMode) {
      document.body.classList.add('dark-mode');
    }
  });

  // Search notes
  document.getElementById('search-input').addEventListener('input', function () {
    const searchText = this.value.toLowerCase();
    document.querySelectorAll('.note-item').forEach(note => {
      const noteText = note.querySelector('.note-text').textContent.toLowerCase();
      note.style.display = noteText.includes(searchText) ? 'block' : 'none';
    });
  });
});
