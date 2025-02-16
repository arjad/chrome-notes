function loadNotes() {
  chrome.storage.sync.get(['notes'], function (result) {
    const notes = result.notes || [];
    notesList.innerHTML = '';

    notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    notes.reverse().forEach(function (note) {
      const noteElement = document.createElement('div');
      noteElement.className = 'note-item' + (note.pinned ? ' pinned' : '');

      noteElement.innerHTML = `
        <div>
          <div class="note-text">${note.text}</div>
          <small class="date">${note.date}</small>
          <div class="icons">
            <i class="fas fa-thumbtack pin-icon" data-id="${note.id}" style="color: ${note.pinned ? 'red' : 'black'}"></i>
            <i class="fas fa-trash delete-icon" data-id="${note.id}"></i>
            <i class="fa-solid fa-copy copy-icon" data-id="${note.id}"></i>
          </div>
        </div>`;
      notesList.appendChild(noteElement);
    });

    document.querySelectorAll('.pin-icon').forEach(icon => {
      icon.addEventListener('click', function () {
        const noteId = parseInt(this.dataset.id);
        togglePin(noteId);
      });
    });

    document.querySelectorAll('.delete-icon').forEach(icon => {
      icon.addEventListener('click', function () {
        const noteId = parseInt(this.dataset.id);
        confirmDelete(noteId);
      });
    });

    document.querySelectorAll('.copy-icon').forEach(icon => {
      icon.addEventListener('click', function () {
        const noteText = notes.find(n => n.id == this.dataset.id).text;
        navigator.clipboard.writeText(noteText);
      });
    });
  });
}

loadNotes();
