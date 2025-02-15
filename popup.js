document.addEventListener('DOMContentLoaded', function() {
  const noteInput = document.getElementById('note-input');
  const saveBtn = document.getElementById('save-btn');
  const notesList = document.getElementById('notes-list');
  const errorMsg = document.getElementsByClassName('error-msg')[0];

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
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      notesList.innerHTML = '';
     
      notes.reverse().forEach(function(note) {
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
          const noteId = parseInt(this.getAttribute('data-id'));
              // Show confirmation popup
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote(noteId);
    }
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
              
              // Optional: Show visual feedback that text was copied
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
  function deleteNote(noteId) {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      const filteredNotes = notes.filter(note => note.id !== noteId);
      chrome.storage.sync.set({ notes: filteredNotes }, function() {
        loadNotes();
      });
    });
  }
});

// dark mode
document.addEventListener('DOMContentLoaded', function() {
  const settingsIcon = document.querySelector('.fa-gear');

  // Check for dark mode setting
  chrome.storage.sync.get('darkMode', function (data) {
    if (data.darkMode) {
      document.body.classList.add('dark-mode');
    }
  });

  // Open settings page when gear icon is clicked
  settingsIcon.addEventListener('click', function() {
    chrome.tabs.create({ url: 'setting/settings.html' });
  });

});
