document.addEventListener('DOMContentLoaded', function() {
  const noteInput = document.getElementById('note-input');
  const saveBtn = document.getElementById('save-btn');
  const notesList = document.getElementById('notes-list');
  const errorMsg = document.getElementsByClassName('error-msg')[0];

  // Load existing notes
  loadNotes();
  // Advanced Search Options: Adding search by category, priority, etc.
searchInput.addEventListener('input', function() {
  loadNotes(searchInput.value); 
});
  // Save note with priority
const priority = document.getElementById('priority-select').value;
const newNote = {
  id: Date.now(),
  text: noteText,
  category: category,
  priority: priority, 
  date: new Date().toLocaleDateString(),
  pinned: false,
};
  // Note Sharing: Implement share button and copy note to clipboard
document.querySelectorAll('.share-icon').forEach(icon => {
  icon.addEventListener('click', function() {
    const noteId = parseInt(this.getAttribute('data-id'));
    const note = notes.find(n => n.id === noteId);
    if (note) {
      navigator.clipboard.writeText(note.text).then(() => {
        console.log("Note shared!");
      }).catch(err => console.error('Share failed:', err));
    }
  });
});
// Reminder/Notifications: Set reminders for notes
chrome.alarms.create(noteId.toString(), { when: reminderTime }); // Create a reminder alarm

chrome.alarms.onAlarm.addListener(function(alarm) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'note.png',
    title: 'Reminder',
    message: `Reminder for note: ${noteText}`
  });
});
// Export Notes
function exportNotes() {
  chrome.storage.sync.get(['notes'], function(result) {
    const notes = result.notes || [];
    const blob = new Blob([JSON.stringify(notes)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'notes_backup.json';
    link.click();
  });
}

// Add an "Export Notes" button in popup.html
<button id="export-btn">Export Notes</button>
// Handle theme change
document.getElementById('theme-select').addEventListener('change', function() {
  const theme = this.value;
  chrome.storage.sync.set({ theme: theme });
  document.body.className = theme;
});
// Autosave functionality
let saveTimeout;
noteInput.addEventListener('input', function() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(function() {
    saveNote();
  }, 5000); // 
});
// Initialize Quill.js editor
var quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['bold', 'italic', 'underline'],
      ['link'],
      ['blockquote']
    ]
  }
});
// Drag-and-Drop: Reorder notes with drag-and-drop
const sortable = new Sortable(notesList, {
  onEnd(evt) {
    const order = sortable.toArray(); // Get the new order
    chrome.storage.sync.set({ notes: order }, function() {
      loadNotes();
    });
  }
});
// Backup Notes
function backupNotes() {
  chrome.storage.sync.get(['notes'], function(result) {
    const notes = result.notes || [];
    const backup = JSON.stringify(notes);
    localStorage.setItem('notes_backup', backup);  // Local backup
  });
}

// Add "Backup" button to HTML
<button id="backup-btn">Backup Notes</button>


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
          deleteNote(noteId);
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
              this.style.color = '#28a745'; /
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
