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

// Open button
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
  innerText: '☰'
});
document.body.appendChild(openBtn);

// Sidebar
const sidebar = createElement('div', {
  position: 'fixed',
  top: '0',
  right: '-400px',
  width: '300px',
  height: '100vh',
  display: 'none', // Initially hidden
  backgroundColor: '#fff',
  boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
  transition: 'right 0.3s ease',
  zIndex: '9999',
  color: 'black',
  padding: '20px'
}, {
  id: 'my-extension-sidebar'
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
const content = createElement('h3', {
  marginBottom: '10px',
  color: '#684993'
}, {
  innerText: 'i Notes'
});
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
    const noteText = createElement('li', {
      fontSize: '14px',
      lineHeight: '1.4',
      marginBottom: '5px',
      wordWrap: 'break-word'
    }, {
      innerText: note.text
    });

    sidebar.appendChild(noteText);
  });
}


// Toggle logic
openBtn.addEventListener('click', () => {
  sidebar.style.display = 'block';
  sidebar.style.right = '0';
});
closeBtn.addEventListener('click', () => {
  sidebar.style.right = '-50rem';
  setTimeout(() => {
    sidebar.style.display = 'none';
  }, 300);
});

loadNotes();
