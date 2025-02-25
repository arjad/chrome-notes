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
          date: new Date().toISOString(), // Store as ISO for reliable sorting
          pinned: false,
          pinnedAt: null
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
      const sort_val = result.sort_value || 'date-desc';

      // Separate pinned and unpinned notes
      const pinnedNotes = notes.filter(note => note.pinned);
      const unpinnedNotes = notes.filter(note => !note.pinned);

      // Sort pinned notes by pinnedAt timestamp (newest first)
      pinnedNotes.sort((a, b) => b.pinnedAt - a.pinnedAt);

      // Sort unpinned notes
      unpinnedNotes.sort((a, b) => {
        if (sort_val === "alpha-asc") return a.text.localeCompare(b.text);
        if (sort_val === "alpha-desc") return b.text.localeCompare(a.text);
        if (sort_val === "date-asc") return new Date(a.date) - new Date(b.date);
        return new Date(b.date) - new Date(a.date);
      });

      // Combine pinned and sorted unpinned notes
      const sortedNotes = [...pinnedNotes, ...unpinnedNotes];
      notesList.innerHTML = '';
      sortedNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
          <div>
            <div class="note-text">${note.text}</div>
            <span class="options" data-id="${note.id}">
              <small class="date">${new Date(note.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
              <div class="icons">
                <i class="fas fa-thumbtack pin-icon" data-id="${note.id}" style="color: ${note.pinned ? '#ffc107' : '#6c757d'};"></i>
                <i class="fas fa-trash delete-icon" data-id="${note.id}"></i>
                <i class="fa-solid fa-copy copy-icon" data-id="${note.id}"></i>
              </div>
            </span>
          </div>`;
        notesList.appendChild(noteElement);
      });

      attachEventListeners();
    });
  }

  // Attach event listeners for actions
  function attachEventListeners() {
    document.querySelectorAll('.pin-icon').forEach(icon => {
      icon.addEventListener('click', function() {
        togglePin(parseInt(this.getAttribute('data-id')));
      });
    });

    document.querySelectorAll('.delete-icon').forEach(icon => {
      icon.addEventListener('click', function() {
        noteIdToDelete = parseInt(this.getAttribute('data-id'));
        deleteModal.style.display = 'flex';
      });
    });

    document.querySelectorAll('.copy-icon').forEach(icon => {
      icon.addEventListener('click', async function() {
        const noteId = parseInt(this.getAttribute('data-id'));
        chrome.storage.sync.get(['notes'], function(result) {
          const note = result.notes.find(n => n.id === noteId);
          if (note) {
            navigator.clipboard.writeText(note.text).then(() => {
              icon.style.color = '#28a745';
              setTimeout(() => icon.style.color = '', 1000);
            }).catch(err => console.error('Failed to copy text:', err));
          }
        });
      });
    });
  }

  // Toggle pin status
  function togglePin(noteId) {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      const updatedNotes = notes.map(note => note.id === noteId ? { ...note, pinned: !note.pinned, pinnedAt: note.pinned ? null : Date.now() } : note);
      chrome.storage.sync.set({ notes: updatedNotes }, loadNotes);
    });
  }

  // Delete note
  function deleteNote() {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes.filter(note => note.id !== noteIdToDelete);
      chrome.storage.sync.set({ notes }, () => {
        loadNotes();
        deleteModal.style.display = 'none';
      });
    });
  }

  // Handle modal actions
  confirmDeleteBtn.addEventListener('click', deleteNote);
  cancelDeleteBtn.addEventListener('click', () => deleteModal.style.display = 'none');

  // Open settings
  document.querySelector('.fa-gear').addEventListener('click', () => {
    chrome.tabs.create({ url: 'setting/settings.html' });
  });

  // Apply dark mode if enabled
  chrome.storage.sync.get('darkMode', function(data) {
    if (data.darkMode) document.body.classList.add('dark-mode');
  });

  // Search notes
  document.getElementById('search-input').addEventListener('input', function() {
    const searchText = this.value.toLowerCase();
    document.querySelectorAll('.note-item').forEach(note => {
      note.style.display = note.querySelector('.note-text').textContent.toLowerCase().includes(searchText) ? 'block' : 'none';
    });
  });
});
