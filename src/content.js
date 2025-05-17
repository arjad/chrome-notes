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
  right: '-300px',
  width: '300px',
  height: '100vh',
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
const content = createElement('div', {}, {
  innerHTML: '<p>Coming Soon</p>'
});
sidebar.appendChild(content);

// Toggle logic
openBtn.addEventListener('click', () => {
  sidebar.style.right = '0';
});
closeBtn.addEventListener('click', () => {
  sidebar.style.right = '-300px';
});
