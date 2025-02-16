document.addEventListener('DOMContentLoaded', function () {
  const noteInput = document.getElementById('note-input');
  const saveBtn = document.getElementById('save-btn');
  const notesList = document.getElementById('notes-list');
  const errorMsg = document.getElementsByClassName('error-msg')[0];
  const reminderInput = document.getElementById('reminder-time');

  loadNotes();

  saveBtn.addEventListener('click', function () {
    const noteText = noteInput.value.trim();
    const reminderTime = reminderInput.value;

    if (noteText) {
      errorMsg.style.display = "none";

      chrome.storage.sync.get(['notes'], function (result) {
        const notes = result.notes || [];
        const newNote = {
          id: Date.now(),
          text: noteText,
          date: new Date().toLocaleDateString('en-US'),
          reminder: reminderTime ? new Date(reminderTime).getTime() : null
        };
        notes.push(newNote);

        chrome.storage.sync.set({ notes: notes }, function () {
          noteInput.value = '';
          reminderInput.value = '';
          loadNotes();
          if (newNote.reminder) scheduleReminder(newNote);
        });
      });
    } else {
      errorMsg.style.display = "block";
    }
  });

  function loadNotes() {
    chrome.storage.sync.get(['notes'], function (result) {
      const notes = result.notes || [];
      notesList.innerHTML = '';

      notes.reverse().forEach(function (note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';

        if (note.reminder && note.reminder - Date.now() < 24 * 60 * 60 * 1000) {
          noteElement.style.backgroundColor = 'yellow';
        }

        noteElement.innerHTML = `
          <div>
            <div class="note-text">${note.text}</div>
            <small class="date">${note.date}</small>
            ${note.reminder ? `<small class="reminder">Reminder: ${new Date(note.reminder).toLocaleString()}</small>` : ''}
            <div class="icons">
              <i class="fas fa-trash delete-icon" data-id="${note.id}"></i>
              <i class="fa-solid fa-copy copy-icon" data-id="${note.id}"></i>
            </div>
          </div>`;
        notesList.appendChild(noteElement);
      });

      document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function () {
          const noteId = parseInt(this.getAttribute('data-id'));
          deleteNote(noteId);
        });
      });

      document.querySelectorAll('.copy-icon').forEach(icon => {
        icon.addEventListener('click', async function () {
          const noteId = parseInt(this.getAttribute('data-id'));
          const note = notes.find(n => n.id === noteId);
          if (note) {
            try {
              await navigator.clipboard.writeText(note.text);
              this.style.color = '#28a745';
              setTimeout(() => { this.style.color = ''; }, 1000);
            } catch (err) {
              console.error('Failed to copy text: ', err);
            }
          }
        });
      });
    });
  }

  function scheduleReminder(note) {
    const now = Date.now();
    if (note.reminder > now) {
      setTimeout(() => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'note.png',
          title: 'Reminder: I Notes',
          message: `Reminder for note: "${note.text}"`,
          priority: 2
        });
      }, note.reminder - now);
    }
  }

  function deleteNote(noteId) {
    chrome.storage.sync.get(['notes'], function (result) {
      const notes = result.notes || [];
      const filteredNotes = notes.filter(note => note.id !== noteId);
      chrome.storage.sync.set({ notes: filteredNotes }, function () {
        loadNotes();
      });
    });
  }

  chrome.storage.sync.get('notes', function (result) {
    const notes = result.notes || [];
    notes.forEach(note => {
      if (note.reminder) scheduleReminder(note);
    });
  });
});

