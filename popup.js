document.addEventListener('DOMContentLoaded', function() {
  const noteInput = document.getElementById('note-input');
  const saveBtn = document.getElementById('save-btn');
  const notesList = document.getElementById('notes-list');
  const errorMsg = document.getElementsByClassName('error-msg')[0];
  const deleteModal = document.getElementById('delete-modal'); // Custom delete modal
  const confirmDeleteBtn = document.getElementById('confirm-delete'); // Confirm delete button
  const cancelDeleteBtn = document.getElementById('cancel-delete'); // Cancel delete button
  let noteIdToDelete = null; // Store the note ID to delete

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
          })
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

      // Add delete functionality
      document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          noteIdToDelete = parseInt(this.getAttribute('data-id'));
          // Open custom modal to confirm deletion
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

  // Delete note
  function deleteNote() {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      const filteredNotes = notes.filter(note => note.id !== noteIdToDelete);
      chrome.storage.sync.set({ notes: filteredNotes }, function() {
        loadNotes();
        // Close the modal after deletion
        deleteModal.style.display = 'none';
      });
    });
  }

  // Handle modal actions
  confirmDeleteBtn.addEventListener('click', function() {
    deleteNote();
  });

  cancelDeleteBtn.addEventListener('click', function() {
    // Close modal without deleting
    deleteModal.style.display = 'none';
  });

  // open settings
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
