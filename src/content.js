// content.js

// Helper function to create elements with styles and attributes
function createElement(tag, styles = {}, attributes = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, styles);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key in el) {
      el[key] = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  return el;
}

let shouldRunNotes = false;
let allNotes = [];
let editingNoteId = null;

chrome.storage.local.get(["settings"], (result) => {
  const settings = result.settings || {};
  shouldRunNotes = settings.hideSortNotes;

  if (!settings.hideSortNotes) {
    // ===== Open Button =====
    const openBtn = createElement('button', {
      position: 'fixed',
      top: '20px',
      right: '0px',
      zIndex: '9998',
      padding: '10px',
      borderRadius: '5px',
      border: 'none',
      color: 'white',
      backgroundColor: '#684993',
      cursor: 'pointer',
    }, {
      innerHTML: '<span style="margin-right: 10px;">☰</span>'
    });
    document.body.appendChild(openBtn);

    // Small cross
    const smallClose = createElement('span', {
      position: 'absolute',
      top: '-5px',
      width: '18px',
      height: '18px',
      backgroundColor: 'white',
      color: 'black',
      borderRadius: '50%',
      fontSize: '12px',
      textAlign: 'center',
      cursor: 'pointer',
      boxShadow: '0 0 2px rgba(0,0,0,0.3)',
      fontWeight: 'bold',
      display: 'none'
    }, { innerText: '×', title: 'Hide' });
    openBtn.appendChild(smallClose);

    openBtn.addEventListener('mouseenter', () => smallClose.style.display = 'block');
    openBtn.addEventListener('mouseleave', () => smallClose.style.display = 'none');

    smallClose.addEventListener('click', (e) => {
      e.stopPropagation();
      openBtn.style.display = 'none';
      chrome.storage.local.get(["settings"], (result) => {
        const settings = result.settings || {};
        settings.hideSortNotes = true;
        chrome.storage.local.set({ settings });
      });
    });

    // ===== Sidebar =====
    const sidebar = createElement('div', {
      position: 'fixed',
      top: '0',
      right: '-400px',
      width: '300px',
      height: '100vh',
      display: 'none',
      backgroundColor: '#fff',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
      transition: 'right 0.3s ease',
      zIndex: '9999',
      color: 'black',
      padding: '20px',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif'
    });
    document.body.appendChild(sidebar);

    // Close button
    const closeBtn = createElement('button', {
      position: 'absolute',
      top: '0px',
      right: '5px',
      fontSize: '20px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'black'
    }, { innerText: '×' });
    sidebar.appendChild(closeBtn);

    // Header with search
    const imageUrl = chrome.runtime.getURL("assets/note.png");
    const content = document.createElement('div');
    content.style.marginBottom = '10px';
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.justifyContent = 'space-between';
    content.innerHTML = `
      <div class="inline">
        <img style="height: 20px; display: inline; margin-right: 2px;" src="${imageUrl}" />
        <b><i style="color: #684993;">i</i>
        <span>Notes</span></b>
      </div>
      <input type="text" id="notes-search" placeholder="Search notes..." 
        style="padding: 6px 8px; border-radius: 4px; font-size: 12px; flex:1; margin-left:5px;" />
    `;
    sidebar.appendChild(content);

    // Notes list container
    const notesList = createElement('ul', {
      listStyle: 'none',
      padding: '0',
      margin: '0',
      height: '60%',
      overflowY: 'auto'
    }, { id: 'notes-list' });
    sidebar.appendChild(notesList);

    // ===== Rich Text Editor =====
    const editorSection = createElement('div', {
      position: 'absolute',
      bottom: '70px',
      left: '0',
      width: '100%',
      background: '#fff',
      padding: '10px',
      borderTop: '1px solid #ddd'
    });

    // Toolbar
    const toolbar = createElement('div', { display: 'flex', gap: '6px', marginBottom: '6px' });
    const buttons = [
      { cmd: 'bold', icon: 'B' },
      { cmd: 'italic', icon: 'I' },
      { cmd: 'underline', icon: 'U' },
      { cmd: 'insertUnorderedList', icon: '• List' },
      { cmd: 'insertOrderedList', icon: '1. List' },
      { cmd: 'insertHTML', icon: '</>' }
    ];
    buttons.forEach(btn => {
      const button = createElement('button', {
        padding: '4px 6px',
        cursor: 'pointer',
        border: '1px solid #ccc',
        background: '#f8f9fa'
      }, { innerText: btn.icon });

      button.addEventListener('click', () => {
        if (btn.cmd === 'insertHTML') {
          document.execCommand('insertHTML', false,
            `<code style="background:#c2c2c2;padding:3px;border-radius:3px;">${window.getSelection()}</code>`
          );
        } else {
          document.execCommand(btn.cmd, false, null);
        }
      });

      toolbar.appendChild(button);
    });
    editorSection.appendChild(toolbar);

    // Editable div
    const editor = createElement('div', {
      minHeight: '80px',
      border: '1px solid #ccc',
      padding: '6px',
      borderRadius: '4px',
      overflowY: 'auto'
    }, { contentEditable: true, id: 'note-editor' });
    editorSection.appendChild(editor);

    // Save button
    const saveBtn = createElement('button', {
      marginTop: '6px',
      padding: '6px',
      width: '100%',
      backgroundColor: '#684993',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '4px'
    }, { innerText: 'Save Note' });
    editorSection.appendChild(saveBtn);

    // Voice input button
    const voiceBtn = createElement('button', {
      marginTop: '6px',
      padding: '6px',
      width: '100%',
      backgroundColor: '#eee',
      border: '1px solid #ccc',
      cursor: 'pointer'
    }, { innerText: '🎤 Voice Input' });
    editorSection.appendChild(voiceBtn);

    sidebar.appendChild(editorSection);

    // ===== GitHub Link =====
    const githubLinkContainer = createElement('div', { position: 'absolute', bottom: '10px', left: '0', width: '100%' });
    githubLinkContainer.innerHTML = `
      <hr style="margin: 10px 0;"/>
      <div style="text-align: center; background-color: white; padding-top: 5px; height:3rem; font-size: 12px;">
        <a href="https://github.com/arjad/chrome-notes" target="_blank" style="color: #684993; text-decoration: none;">View Source on GitHub</a>
        <br />
        <a href="https://github.com/arjad" target="_blank" style="color: #999; font-size: 11px;">@arjad</a>
      </div>
    `;
    sidebar.appendChild(githubLinkContainer);

    // ===== Functions =====
    function loadNotes() {
      chrome.storage.local.get(["notes"], (result) => {
        allNotes = result.notes || [];
        displayNotes(allNotes);
      });
    }

    function displayNotes(notes) {
      notesList.innerHTML = '';
      if (!notes.length) {
        notesList.appendChild(createElement('li', { padding:'10px', textAlign:'center', color:'#666', fontStyle:'italic' }, { innerText:'No notes yet' }));
        return;
      }

      notes.forEach(note => {
        if (note.deleted) return;
        const noteItem = document.createElement('li');
        noteItem.style.fontSize = '14px';
        noteItem.style.lineHeight = '1.4';
        noteItem.style.marginBottom = '5px';
        noteItem.style.wordWrap = 'break-word';
        noteItem.innerHTML = `
          <div class="note-item" style="padding:10px 0;border-bottom:1px solid #6c757d;">
            <div>
              <div class="note-text">${note.text}</div>
              <span class="options" style="display:flex; justify-content:space-between; align-items:center;" data-id="${note.id}">
                <small class="date" style="font-size:0.5rem; color:#6c757d; border:1px solid #6c757d; border-radius:12px; padding:1px 8px;">
                  ${new Date(note.date).toLocaleDateString('en-US',{year:'numeric', month:'long', day:'numeric'})}
                </small>
                <div class="icons">
                  <span class="edit-btn" data-id="${note.id}" style="cursor:pointer; margin-right:6px;">Edit</span>
                  <span class="copy-btn" data-id="${note.id}" data-text="${note.text}" style="cursor:pointer;">Copy</span>
                </div>
              </span>
            </div>
          </div>
        `;

        // Copy
        const copyBtn = noteItem.querySelector('.copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(copyBtn.dataset.text).then(() => {
              copyBtn.innerText = 'Copied!';
              setTimeout(() => copyBtn.innerText = 'Copy', 1000);
            });
          });
        }

        // Edit
        const editBtn = noteItem.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            editingNoteId = note.id;
            editor.innerHTML = note.text;
            saveBtn.innerText = "Update Note";
            sidebar.scrollTop = sidebar.scrollHeight;
          });
        }

        notesList.appendChild(noteItem);
      });
    }

    // Search
    const searchInput = content.querySelector('#notes-search');
    searchInput.addEventListener('input', () => {
      const searchText = searchInput.value.toLowerCase();
      const filtered = allNotes.filter(note =>
        !note.deleted && note.text.toLowerCase().includes(searchText)
      );
      displayNotes(filtered);
    });

    // Save / Create note
    saveBtn.addEventListener('click', () => {
      const content = editor.innerHTML.trim();
      if (!content) return;

      chrome.storage.local.get(["notes"], (result) => {
        let notes = result.notes || [];
        if (editingNoteId) {
          notes = notes.map(note => note.id === editingNoteId ? {...note, text: content } : note);
          editingNoteId = null;
          saveBtn.innerText = "Save Note";
        } else {
          notes.unshift({ id: Date.now(), text: content, date: new Date().toISOString(), deleted:false });
        }
        chrome.storage.local.set({ notes }, () => {
          editor.innerHTML = '';
          loadNotes();
        });
      });
    });

    // Voice input
    let recognition;
    let isListening = false;
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length -1][0].transcript;
        editor.innerHTML += transcript + " ";
      };
      voiceBtn.addEventListener('click', () => {
        if (!isListening) { recognition.start(); voiceBtn.innerText="⛔ Stop"; }
        else { recognition.stop(); voiceBtn.innerText="🎤 Voice Input"; }
        isListening = !isListening;
      });
    }

    // Toggle sidebar
    openBtn.addEventListener('click', () => { sidebar.style.display='block'; sidebar.style.right='0'; loadNotes(); });
    closeBtn.addEventListener('click', () => { sidebar.style.right='-50rem'; setTimeout(()=>{ sidebar.style.display='none'; }, 300); });
  }
});