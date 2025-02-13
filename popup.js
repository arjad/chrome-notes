document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const searchInput = document.getElementById('search-input'); 
  const noteInput = document.getElementById('note-input'); 
  const saveBtn = document.getElementById('save-btn');  
  const notesList = document.getElementById('notes-list'); 
  const errorMsg = document.getElementsByClassName('error-msg')[0];  
  let editingNoteId = null; 

  // Load existing notes when the page loads
  loadNotes();

  // Event listener for the search input field
  searchInput.addEventListener('input', function() {
    loadNotes(searchInput.value); 
  });

  // Event listener for the save button
  saveBtn.addEventListener('click', function() {
    const noteText = noteInput.value.trim();  
    const category = document.getElementById('category-select').value;  
    if (noteText) {
      errorMsg.style.display = "none";  
      if (editingNoteId) {
        // If editing an existing note
        chrome.storage.sync.get(['notes'], function(result) {
          const notes = result.notes || [];
          const noteIndex = notes.findIndex(note => note.id === editingNoteId);  
          if (noteIndex !== -1) {
            notes[noteIndex].text = noteText; 
            notes[noteIndex].category = category;  
            chrome.storage.sync.set({ notes: notes }, function() {
              noteInput.value = ''; 
              editingNoteId = null; 
              loadNotes(); 
            });
          }
        });
      } else {
        // If creating a new note
        chrome.storage.sync.get(['notes'], function(result) {
          const notes = result.notes || [];
          const newNote = {
            id: Date.now(),  
            text: noteText, 
            category: category, 
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),  
            pinned: false,  
          };
          notes.push(newNote);  
          chrome.storage.sync.set({ notes: notes }, function() {
            noteInput.value = ''; 
            loadNotes(); 
          });
        });
      }
    } else {
      errorMsg.style.display = "block";  
    }
  });

  // Function to load and display notes (with optional search query)
  function loadNotes(searchQuery = '') {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      notesList.innerHTML = '';  

      // Filter notes by search query
      const filteredNotes = notes.filter(note =>
        note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

      filteredNotes.reverse().forEach(function(note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `<div class="${note.pinned ? 'pinned' : ''}">
          <div class="note-text">${note.text}</div>
          <div class="category">${note.category}</div>
          <span class="options" data-id="${note.id}">
            <small class="date">${note.date}</small>
            <div class="icons">
              <i class="fas fa-trash delete-icon" data-id="${note.id}"></i>  <!-- Delete icon -->
              <i class="fa-solid fa-copy copy-icon" data-id="${note.id}"></i>  <!-- Copy icon -->
              <i class="fa-solid fa-edit edit-icon" data-id="${note.id}"></i>  <!-- Edit icon -->
              <i class="fa-solid fa-thumbtack pin-icon" data-id="${note.id}"></i>  <!-- Pin icon -->
            </div>
          </span>
        </div>`;
        notesList.appendChild(noteElement);  
      });

      document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          const noteId = parseInt(this.getAttribute('data-id'));
          deleteNote(noteId); 
        });
      });

      document.querySelectorAll('.copy-icon').forEach(icon => {
        icon.addEventListener('click', async function() {
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

      document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          const noteId = parseInt(this.getAttribute('data-id'));
          const note = notes.find(n => n.id === noteId);
          if (note) {
            noteInput.value = note.text;  
            document.getElementById('category-select').value = note.category;  
            editingNoteId = note.id;  
          }
        });
      });

      document.querySelectorAll('.pin-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          const noteId = parseInt(this.getAttribute('data-id'));
          togglePin(noteId);  
        });
      });
    });
  }

  // Function to delete a note
  function deleteNote(noteId) {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      const filteredNotes = notes.filter(note => note.id !== noteId);  
      chrome.storage.sync.set({ notes: filteredNotes }, function() {
        loadNotes();  
      });
    });
  }

  // Function to toggle pinning a note
  function togglePin(noteId) {
    chrome.storage.sync.get(['notes'], function(result) {
      const notes = result.notes || [];
      const noteIndex = notes.findIndex(note => note.id === noteId); 
      if (noteIndex !== -1) {
        notes[noteIndex].pinned = !notes[noteIndex].pinned;  
        chrome.storage.sync.set({ notes: notes }, function() {
          loadNotes();  
        });
      }
    });
  }
});

