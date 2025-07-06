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
chrome.storage.local.get(["settings"], (result) => {
  const settings = result.settings || {};
  shouldRunNotes = settings.hideSortNotes;
  if (!settings.hideSortNotes) {

    // Create the open button
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
    
    
    // Show/hide cross on hover
    openBtn.addEventListener('mouseenter', () => {
      smallClose.style.display = 'block';
    });
    openBtn.addEventListener('mouseleave', () => {
      smallClose.style.display = 'none';
    });
    
    // Load setting to determine visibility
    chrome.storage.local.get(["settings"], (result) => {
      const settings = result.settings || {};
      if (!settings.hide_side_notes) {
        console.log("Side Notes are enabled");
      }
    });
    // Create the small cross
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
      display: 'none' // Initially hidden
    }, {
      innerText: '×',
      title: 'Hide'
    });
    openBtn.appendChild(smallClose);
    
    
    // Hide the open button
    smallClose.addEventListener('click', (e) => {
      e.stopPropagation();
      openBtn.style.display = 'none';
    
      // Update chrome.storage.local settings
      chrome.storage.local.get(["settings"], (result) => {
        const settings = result.settings || {};
        settings.hideSortNotes = true;
        chrome.storage.local.set({ settings });
      });
    });
    
    // Sidebar
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
      padding: '20px'
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
    }, {
      innerText: '×'
    });
    sidebar.appendChild(closeBtn);
    
    // Content
    const imageUrl = chrome.runtime.getURL("assets/note.png");
    const content = document.createElement('h3');
    content.style.marginBottom = '10px';
    
    content.innerHTML = `
      <img style="height: 25px; display: inline; margin-right: 5px;" src="${imageUrl}" />
      <i class="mr-1" style="color: #684993;">i</i>
      <span>Notes</span>
    `;
    
    sidebar.appendChild(content);
    
    // Notes list container
    const notesList = createElement('ul', {
      listStyle: 'none',
      padding: '0',
      margin: '0'
    }, {
      id: 'notes-list'
    });
    sidebar.appendChild(notesList);
    
    // Function to load notes from Chrome storage
    function loadNotes() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(["notes"], (result) => {
          if (result.notes) {
            displayNotes(result.notes);
          }
        });
      } 
    }
    
    // Function to display notes in the list
    function displayNotes(notes) {
      notesList.innerHTML = '';
      
      if (notes.length === 0) {
        const emptyMsg = createElement('li', {
          padding: '10px',
          textAlign: 'center',
          color: '#666',
          fontStyle: 'italic'
        }, {
          innerText: 'No notes yet'
        });
        notesList.appendChild(emptyMsg);
        return;
      }
    
      notes.forEach(note => {
        if (note.deleted) return false;
        const html = `
          <div class="note-item" style="padding: 10px 0px;     border-bottom: 1px solid #6c757d;">
            <div>
              <div class="note-text">${note.text}</div>
              <span class="options" style="display: flex; justify-content: space-between; align-items: center;" data-id="${note.id}">
                <small class="date" style="font-size: 0.5rem; color: #6c757d; border: 1px solid #6c757d; border-radius: 12px; padding: 1px 8px; display: inline-block;">${note.date}</small>
                <div class="icons">
                  <span data-id="${note.id}" style=" border: 1px solid blue; color: blue; font-size: 0.6rem; padding: 0.3rem; margin-right: 0.3rem; cursor: pointer;"> Copy </span>
                </div>
              </span>
            </div>
          </div>
        `;
      
        const noteItem = document.createElement('li');
        noteItem.style.fontSize = '14px';
        noteItem.style.lineHeight = '1.4';
        noteItem.style.marginBottom = '5px';
        noteItem.style.wordWrap = 'break-word';
        noteItem.innerHTML = html;
      
        notesList.appendChild(noteItem);
      });
    }  
    
    
    // Toggle logic
    openBtn.addEventListener('click', () => {
      sidebar.style.display = 'block';
      sidebar.style.right = '0';
      loadNotes();
    });
    closeBtn.addEventListener('click', () => {
      sidebar.style.right = '-50rem';
      setTimeout(() => {
        sidebar.style.display = 'none';
      }, 300);
    });
  }
});
