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
    let allNotes = [];

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
      display: 'none'
    }, {
      innerText: '×',
      title: 'Hide'
    });
    openBtn.appendChild(smallClose);
    
    
    // Hide the open button
    smallClose.addEventListener('click', (e) => {
      e.stopPropagation();
      openBtn.style.display = 'none';
    
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
        style=" display: inline%; padding: 6px 8px; border-radius: 4px; font-size: 12px;" />
    `;
    
    sidebar.appendChild(content);
    
    // Notes list container
    const notesList = createElement('ul', {
      listStyle: 'none',
      padding: '0',
      margin: '0',
      height: '90vh',
      margin: '0px',
      overflowY: 'auto'
    }, {
      id: 'notes-list'
    });
    sidebar.appendChild(notesList);
    
    // Function to load notes from Chrome storage
    function loadNotes() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(["notes"], (result) => {
          if (result.notes) {
            allNotes = result.notes || [];
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
        if (note.deleted) return;

        const html = `
          <div class="note-item" style="padding: 10px 0px; border-bottom: 1px solid #6c757d;">
            <div>
              <div class="note-text">${note.text.replace(/`([^`]+)`/g, `<code style="background-color:#c2c2c2;color:black;font-family:'Courier New',Courier,monospace;padding:3px;margin:8px 0;white-space:pre-wrap;border-radius:3px;">$1</code>`) }</div>
              <span class="options" style="display: flex; justify-content: space-between; align-items: center;" data-id="${note.id}">
                <small class="date" style="font-size: 0.5rem; color: #6c757d; border: 1px solid #6c757d; border-radius: 12px; padding: 1px 8px;">${formatDate(note.date)}</small>
                <div class="icons">
                  <span class="copy-btn" data-id="${note.id}" data-text="${note.text}" style="border: 1px solid blue; color: blue; font-size: 0.6rem; padding: 0.3rem; margin-right: 0.3rem; cursor: pointer;"> Copy </span>
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

        function formatDate(dateString) {
          const date = new Date(dateString);
          const options = { year: 'numeric', month: 'long', day: 'numeric' }; // Jan 1, 2000
          return date.toLocaleDateString('en-US', options);
        }

        // Attach copy click listener after inserting HTML
        const copyBtn = noteItem.querySelector('.copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            const text = copyBtn.getAttribute('data-text');
            navigator.clipboard.writeText(text).then(() => {
              copyBtn.innerText = 'Copied!';
              setTimeout(() => {
                copyBtn.innerText = 'Copy';
              }, 1000);
            }).catch(err => {
              console.error('Failed to copy:', err);
            });
          });
        }
    
        notesList.appendChild(noteItem);
      });
    }  
    
    const searchInput = content.querySelector('#notes-search');
    searchInput.addEventListener('input', () => {
      const searchText = searchInput.value.toLowerCase();
      const filtered = allNotes.filter(note => 
        !note.deleted && note.text.toLowerCase().includes(searchText)
      );
      displayNotes(filtered);
    });

    
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

    const githubLinkContainer = document.createElement('div');
    githubLinkContainer.innerHTML = `
    <hr style="margin: 10px 0;"/>
    <div style="text-align: center; background-color: white; padding-top: 5px; height:3rem; center; font-size: 12px;">
      <a href="https://github.com/arjad/chrome-notes" target="_blank" style="color: #684993; text-decoration: none;">View Source on GitHub</a>
      <br />
      <a href="https://github.com/arjad" target="_blank" style="color: #999; font-size: 11px;">@arjad</a>
    </div>
    `;
    githubLinkContainer.style.position = 'absolute';
    githubLinkContainer.style.bottom = '10px';
    githubLinkContainer.style.left = '0';
    githubLinkContainer.style.width = '100%';

    sidebar.appendChild(githubLinkContainer);
  }
});
