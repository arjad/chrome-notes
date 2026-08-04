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

chrome.storage.local.get(["settings", "idToken", "loginWarningDismissedAt", "userProfile"], (result) => {
  const settings = result.settings || {};
  const idToken = result.idToken;
  let showBanner = !idToken;
  if (result.loginWarningDismissedAt) {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (now - result.loginWarningDismissedAt < oneWeek) {
      showBanner = false;
    }
  }
  shouldRunNotes = settings.hideSortNotes;

  if (!settings.hideSortNotes) {
    const isDarkMode = settings.darkMode === "dark" || (settings.darkMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const bgColor = isDarkMode ? '#1e242d' : '#fff';
    const textColor = isDarkMode ? 'white' : 'black';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#ccc';
    const itemBorderColor = isDarkMode ? '#b8b8b8' : '#6c757d';
    const btnBgColor = isDarkMode ? 'transparent' : '#f8f9fa';

    if (!document.getElementById('inotes-styles')) {
      const style = document.createElement('style');
      style.id = 'inotes-styles';
      style.textContent = `
        .inotes-icon-btn {
          border-radius: 50%;
          padding: 5px;
          margin-right: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid lightgray;
          color: lightgray;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          box-sizing: border-box;
          background-color: transparent;
        }
        .inotes-icon-btn:hover { color: white !important; }
        .inotes-edit-btn:hover { background-color: darkgreen; border-color: darkgreen !important; }
        .inotes-copy-btn:hover { background-color: blue; border-color: blue !important; }
        .inotes-delete-btn:hover { background-color: #dc3545; border-color: #dc3545 !important; }
        .inotes-pin-btn:hover { background-color: #ffd700; border-color: #ffd700 !important; color: white !important; }
        .inotes-pinned { color: #ffd700 !important; border-color: #ffd700 !important; }
        .inotes-note-text { white-space: pre-wrap; overflow-wrap: break-word; }
        .inotes-note-text ul, #note-editor ul { list-style-type: disc !important; padding-left: 20px !important; margin: 5px 0 !important; }
        .inotes-note-text ol, #note-editor ol { list-style-type: decimal !important; padding-left: 20px !important; margin: 5px 0 !important; }
        .inotes-note-text li, #note-editor li { display: list-item !important; }
      `;
      document.head.appendChild(style);
    }

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
      backgroundColor: bgColor,
      boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
      transition: 'right 0.3s ease',
      zIndex: '9999',
      color: textColor,
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
      color: textColor
    }, { innerText: '×' });
    sidebar.appendChild(closeBtn);

    // Header with search and icons
    const imageUrl = chrome.runtime.getURL("assets/note.png");
    const content = document.createElement('div');
    content.style.marginBottom = '10px';
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.justifyContent = 'space-between';
    
    const titleDiv = createElement('div', { display: 'flex', alignItems: 'center' });
    titleDiv.innerHTML = `
      <div class="inline" style="display: flex; align-items: center;">
        <img style="height: 20px; display: inline; margin-right: 2px;" src="${imageUrl}" />
        <b style="display: flex; align-items: center;"><i style="color: #684993; margin-right: 2px;">i</i>
        <span style="margin-left: 2px;">Notes</span></b>
      </div>
    `;

    const rightSideDiv = createElement('div', { display: 'flex', alignItems: 'center', gap: '10px' });

    const searchContainer = createElement('div', { position: 'relative', display: 'flex', alignItems: 'center' });
    
    let showSearchInput = false;

    const searchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width: 14px; height: 14px; fill: currentColor;"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>`;
    const searchIcon = createElement('span', { cursor: 'pointer', display: 'flex', alignItems: 'center', color: textColor });
    searchIcon.innerHTML = searchIconSvg;

    const searchBox = createElement('input', {
      padding: '0px',
      borderRadius: '4px',
      fontSize: '12px',
      backgroundColor: isDarkMode ? 'transparent' : 'white',
      color: textColor,
      border: 'none',
      width: '0px',
      opacity: '0',
      transition: 'all 0.3s ease',
      visibility: 'hidden',
      outline: 'none'
    }, { type: 'text', id: 'notes-search', placeholder: 'Search notes...' });

    searchIcon.addEventListener('click', () => {
      showSearchInput = true;
      searchIcon.style.display = 'none';
      searchBox.style.width = '120px';
      searchBox.style.padding = '4px 8px';
      searchBox.style.opacity = '1';
      searchBox.style.border = `1px solid ${borderColor}`;
      searchBox.style.visibility = 'visible';
      setTimeout(() => searchBox.focus(), 100);
    });
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchBox);

    const profileIcon = createElement('span', { cursor: 'pointer', display: 'flex', alignItems: 'center', color: textColor });
    const userProfile = result.userProfile;
    if (userProfile && userProfile.picture) {
      profileIcon.innerHTML = `<img src="${userProfile.picture}" alt="Profile" style="width: 16px; height: 16px; border-radius: 50%;" />`;
    } else {
      profileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 14px; height: 14px; fill: currentColor;"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>`;
    }
    profileIcon.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: "openTab", url: chrome.runtime.getURL('settings.html?tab=profile') });
    });

    const settingsIcon = createElement('span', { cursor: 'pointer', display: 'flex', alignItems: 'center', color: textColor });
    settingsIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 14px; height: 14px; fill: currentColor;"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>`;
    settingsIcon.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: "openTab", url: chrome.runtime.getURL('settings.html') });
    });

    rightSideDiv.appendChild(searchContainer);
    rightSideDiv.appendChild(profileIcon);
    rightSideDiv.appendChild(settingsIcon);
    
    content.appendChild(titleDiv);
    content.appendChild(rightSideDiv);
    
    sidebar.appendChild(content);

    if (showBanner) {
      const banner = createElement('div', {
        backgroundColor: '#d8b4e2',
        color: '#333',
        padding: '8px',
        borderRadius: '4px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
      });
      const bannerText = createElement('span');
      bannerText.innerHTML = `⚠️ <span id="sidebar-login-link" style="cursor: pointer; text-decoration: underline; color: #684993; font-weight: bold;">Login</span> to make sure that notes are kept safe`;
      
      const rightDiv = createElement('div', { display: 'flex', gap: '8px', alignItems: 'center' });
      
      const closeIcon = createElement('span', {
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px'
      }, { innerText: '×' });
      closeIcon.addEventListener('click', () => {
        banner.style.display = 'none';
        chrome.storage.local.set({ loginWarningDismissedAt: Date.now() });
      });

      rightDiv.appendChild(closeIcon);
      banner.appendChild(bannerText);
      banner.appendChild(rightDiv);
      sidebar.appendChild(banner);

      const loginLink = banner.querySelector('#sidebar-login-link');
      if (loginLink) {
        loginLink.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: "openTab", url: chrome.runtime.getURL('settings.html?tab=profile') });
        });
      }
    }

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
      background: bgColor,
      padding: '10px',
      borderTop: `1px solid ${borderColor}`,
      boxSizing: 'border-box'
    });

    const icons = {
      bold: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M333.49 238a122 122 0 0 0 27-65.21C367.87 96.49 308 32 233.42 32H34a16 16 0 0 0-16 16v48a16 16 0 0 0 16 16h31.87v288H34a16 16 0 0 0-16 16v48a16 16 0 0 0 16 16h209.32c70.8 0 134.14-51.75 141-122.4 4.74-48.45-16.39-92.06-50.83-119.6zM145.66 112h87.76a48 48 0 0 1 0 96h-87.76zm87.76 288h-87.76V288h87.76a56 56 0 0 1 0 112z"/></svg>',
      italic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M320 48v32a16 16 0 0 1-16 16h-62.76l-80 320H208a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H16a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h62.76l80-320H112a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h192a16 16 0 0 1 16 16z"/></svg>',
      underline: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M32 64h32v160c0 88.22 71.78 160 160 160s160-71.78 160-160V64h32a16 16 0 0 0 16-16V16a16 16 0 0 0-16-16H272a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h32v160a80 80 0 0 1-160 0V64h32a16 16 0 0 0 16-16V16a16 16 0 0 0-16-16H32a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zm400 384H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"/></svg>',
      listUl: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M48 48a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm0 160a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm0 160a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm448 16H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"/></svg>',
      listOl: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M61.77 401l17.5-20.15a19.92 19.92 0 0 0 5.07-14.19v-3.31C84.34 356 80.5 352 73 352H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h22.83a157.41 157.41 0 0 0-11 12.31l-5.61 7c-4 5.07-5.25 10.13-2.8 14.88l1.05 1.93c3 5.76 6.29 7.88 12.25 7.88h4.73c10.33 0 15.94 2.44 15.94 9.09 0 4.72-4.2 8.22-14.36 8.22a41.54 41.54 0 0 1-15.47-3.12c-6.49-3.88-11.74-3.5-15.6 3.12l-5.59 9.31c-3.72 6.13-3.19 11.72 2.63 15.94 7.71 4.69 20.38 9.44 37 9.44 34.16 0 48.5-22.75 48.5-44.12-.03-14.38-9.12-29.76-28.73-34.88zM496 224H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM16 160h64a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H64V40a8 8 0 0 0-8-8H32a8 8 0 0 0-7.14 4.42l-8 16A8 8 0 0 0 24 64h8v64H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm-3.91 160H80a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H41.32c3.29-10.29 48.34-18.68 48.34-56.44 0-29.06-25-39.56-44.47-39.56-21.36 0-33.8 10-40.46 18.75-4.37 5.59-3 10.84 2.8 15.37l8.58 6.88c5.61 4.56 11 2.47 16.12-2.44a13.44 13.44 0 0 1 9.46-3.84c3.33 0 9.28 1.56 9.28 8.75C51 248.19 0 257.31 0 304.59v4C0 316 5.08 320 12.09 320z"/></svg>',
      code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="width: 18px; height: 16px; fill: currentColor;"><path d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z"/></svg>',
      image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-55.515-55.515c-4.686-4.686-12.284-4.686-16.971 0L64 336v48z"/></svg>',
      mic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" style="width: 14px; height: 16px; fill: currentColor;"><path d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"/></svg>',
      link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114l-96 96c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0l112.3-112.3zM263 132c-56.5-56.5-148-56.5-204.5 0L-53.8 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6c-31.5-31.5-31.5-82.5 0-114l96-96c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.8l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132L263 132z"/></svg>'
    };

    // Toolbar Container
    const toolbar = createElement('div', {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${borderColor}`,
      paddingBottom: '8px',
      marginBottom: '8px'
    });

    const formatGroup = createElement('div', { display: 'flex', gap: '4px', alignItems: 'center' });
    let isUrlSpecific = false;

    const buttons = [
      { cmd: 'bold', icon: icons.bold },
      { cmd: 'italic', icon: icons.italic },
      { cmd: 'underline', icon: icons.underline },
      { cmd: 'insertUnorderedList', icon: icons.listUl },
      { cmd: 'insertOrderedList', icon: icons.listOl },
      { cmd: 'insertHTML', icon: icons.code },
      { cmd: 'insertImage', icon: icons.image }
    ];

    const fileInput = createElement('input', { display: 'none' }, { type: 'file', accept: 'image/*' });
    editorSection.appendChild(fileInput);

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          const editor = document.getElementById('note-editor');
          if (editor) editor.focus();
          document.execCommand("insertImage", false, resizedBase64);
          fileInput.value = '';
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    buttons.forEach(btn => {
      const button = createElement('button', {
        padding: '4px',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
      button.innerHTML = btn.icon;

      button.addEventListener('click', () => {
        if (btn.cmd === 'insertHTML') {
          const selection = window.getSelection();
          if (!selection.rangeCount) return;
          
          let node = selection.anchorNode;
          // Traverse up to see if we are inside a CODE tag
          while (node && node.id !== 'note-editor') {
            if (node.nodeName === 'CODE') {
              // We are inside a code tag, unwrap it (undo code format)
              const textNode = document.createTextNode(node.textContent);
              node.parentNode.replaceChild(textNode, node);
              // Select the newly unwrapped text
              const range = document.createRange();
              range.selectNodeContents(textNode);
              selection.removeAllRanges();
              selection.addRange(range);
              return;
            }
            node = node.parentNode;
          }
          
          // If we are NOT inside a CODE tag, wrap the selection in code
          const selectedText = selection.toString();
          if (selectedText) {
            document.execCommand('insertHTML', false,
              `<code style="background:#c2c2c2;padding:3px;border-radius:3px;">${selectedText}</code>`
            );
          }
        } else if (btn.cmd === 'insertImage') {
            chrome.storage.local.get(["idToken"], (result) => {
              if (result.idToken) {
                fileInput.click();
              } else {
                // Create an overlay over the sidebar
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(2px);transition:opacity 0.3s;';

                const toast = document.createElement('div');
                toast.style.cssText = 'background:#1e1e2e;color:white;padding:20px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;flex-direction:column;align-items:center;gap:12px;border:1px solid rgba(255,255,255,0.15);text-align:center;max-width:85%;';

                const lockIcon = document.createElement('span');
                lockIcon.textContent = '🔒';
                lockIcon.style.cssText = 'font-size:24px;margin-bottom:4px;';

                const msg = document.createElement('span');
                msg.style.cssText = 'font-size:14px;color:white;line-height:1.4;';
                msg.innerHTML = 'You need to <strong>log in</strong> to add images.';

                const loginBtn = document.createElement('button');
                loginBtn.textContent = 'Go to Profile';
                loginBtn.style.cssText = 'background:#684993;color:white;padding:8px 16px;border-radius:6px;border:none;font-size:13px;font-weight:bold;cursor:pointer;width:100%;margin-top:8px;';
                loginBtn.addEventListener('click', () => {
                  chrome.runtime.sendMessage({ action: "openTab", url: chrome.runtime.getURL('settings.html?tab=profile') });
                  overlay.remove();
                });

                toast.appendChild(lockIcon);
                toast.appendChild(msg);
                toast.appendChild(loginBtn);
                overlay.appendChild(toast);
                sidebar.appendChild(overlay);

                setTimeout(() => {
                  overlay.style.opacity = '0';
                  setTimeout(() => overlay.remove(), 300);
                }, 5000);
              }
            });
          } else {
            document.execCommand(btn.cmd, false, null);
          }
        });

        formatGroup.appendChild(button);
      });

      const linkBtn = createElement('button', {
        background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
        color: textColor, borderRadius: '4px'
      });
      linkBtn.innerHTML = icons.link;
      linkBtn.title = "Link to Website URL";
      linkBtn.addEventListener('click', () => {
        isUrlSpecific = !isUrlSpecific;
        linkBtn.style.color = isUrlSpecific ? 'white' : textColor;
        linkBtn.style.backgroundColor = isUrlSpecific ? '#684993' : 'transparent';
      });
      formatGroup.appendChild(linkBtn);
    
    toolbar.appendChild(formatGroup);

    // Voice input button in toolbar
    const voiceBtn = createElement('button', {
      padding: '4px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      color: textColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    voiceBtn.innerHTML = icons.mic;

    let isListening = false;
    let recognition = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const editor = document.getElementById('note-editor');
          if (editor) {
            editor.focus();
            document.execCommand('insertText', false, finalTranscript + ' ');
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        isListening = false;
        voiceBtn.style.color = textColor;
      };

      recognition.onend = () => {
        isListening = false;
        voiceBtn.style.color = textColor;
      };
    }

    voiceBtn.addEventListener('click', () => {
      if (!recognition) {
        alert("Voice recognition not supported in this browser.");
        return;
      }
      if (isListening) {
        recognition.stop();
        isListening = false;
        voiceBtn.style.color = textColor;
      } else {
        recognition.start();
        isListening = true;
        voiceBtn.style.color = 'red';
      }
    });

    toolbar.appendChild(voiceBtn);

    const editorWrapper = createElement('div', {
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      margin: '0 8px',
      backgroundColor: 'transparent'
    });

    toolbar.style.padding = '8px';
    toolbar.style.margin = '0';
    editorWrapper.appendChild(toolbar);

    // Editable div
    const editor = createElement('div', {
      minHeight: '80px',
      padding: '8px',
      overflowY: 'auto',
      backgroundColor: 'transparent',
      color: textColor,
      border: 'none',
      outline: 'none'
    }, { contentEditable: true, id: 'note-editor' });
    editorWrapper.appendChild(editor);

    editorSection.appendChild(editorWrapper);

    // Save button Container to right-align it
    const saveContainer = createElement('div', {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '10px'
    });

    // Save button
    const saveBtn = createElement('button', {
      padding: '8px 16px',
      backgroundColor: '#684993',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '24px',
      fontSize: '14px',
      fontWeight: '500'
    }, { innerText: 'Save Note' });

    saveContainer.appendChild(saveBtn);
    editorSection.appendChild(saveContainer);

    sidebar.appendChild(editorSection);

    // ===== GitHub Link =====
    const githubLinkContainer = createElement('div', { position: 'absolute', bottom: '10px', left: '0', width: '100%' });
    githubLinkContainer.innerHTML = `
      <hr style="margin: 10px 0; border-top: 1px solid ${borderColor};"/>
      <div style="text-align: center; background-color: ${bgColor}; padding-top: 5px; height:3rem; font-size: 12px;">
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
      const currentUrl = window.location.origin;
      const activeNotes = notes.filter(n => !n.deleted && (!n.url || n.url === currentUrl));
      if (!activeNotes.length) {
        notesList.appendChild(createElement('li', { padding: '10px', textAlign: 'center', color: isDarkMode ? '#b8b8b8' : '#666', fontStyle: 'italic' }, { innerText: 'No notes yet' }));
        return;
      }

      const sortedNotes = [...activeNotes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
      });

      sortedNotes.forEach(note => {
        const noteItem = document.createElement('li');
        noteItem.style.fontSize = '14px';
        noteItem.style.lineHeight = '1.4';
        noteItem.style.marginBottom = '5px';
        noteItem.style.wordWrap = 'break-word';

        const pinClass = note.pinned ? 'inotes-pinned' : '';
        const titleText = note.pinned ? 'Unpin note' : 'Pin note';

        noteItem.innerHTML = `
          <div class="note-item" style="padding:10px 0;border-bottom:1px solid ${itemBorderColor};">
            <div>
              <div class="note-text inotes-note-text">${note.text}</div>
              <span class="options" style="display:flex; justify-content:space-between; align-items:center;" data-id="${note.id}">
                <div style="display: flex; gap: 4px; align-items: center;">
                  <small class="date" style="font-size:0.5rem; color:${itemBorderColor}; border:1px solid ${itemBorderColor}; border-radius:12px; padding:1px 8px;">
                    ${new Date(note.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </small>
                  ${note.url ? `<small style="font-size:0.5rem; color:white; background:#684993; border-radius:12px; padding:1px 8px; display:inline-block; max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${note.url}">${new URL(note.url).hostname.replace('www.','')}</small>` : ''}
                </div>
                <div class="icons">
                  <span class="pin-btn inotes-icon-btn inotes-pin-btn ${pinClass}" data-id="${note.id}" title="${titleText}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width: 10px; height: 10px; fill: currentColor; pointer-events: none;"><path d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c.5 6.5 4.4 11.9 10.4 15L370.7 256H13.3l58.4-28.7c6-3 9.9-8.5 10.4-15L93.5 64H64c-17.7 0-32-14.3-32-32zM192 320L192 512l-48-48-48 48 0-192 192 0z"/></svg>
                  </span>
                  <span class="delete-btn inotes-icon-btn inotes-delete-btn" data-id="${note.id}" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 10px; height: 10px; fill: currentColor; pointer-events: none;"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                  </span>
                  <span class="edit-btn inotes-icon-btn inotes-edit-btn" data-id="${note.id}" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width: 10px; height: 10px; fill: currentColor; pointer-events: none;"><path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8l-11.3 11.3 33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.2 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"/></svg>
                  </span>
                  <span class="copy-btn inotes-icon-btn inotes-copy-btn" data-id="${note.id}" title="Copy">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 10px; height: 10px; fill: currentColor; pointer-events: none;"><path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v40c0 30.9-25.1 56-56 56H48c-30.9 0-56-25.1-56-56V184c0-30.9 25.1-56 56-56z"/></svg>
                  </span>
                </div>
              </span>
            </div>
          </div>
        `;

        // Copy
        const copyBtn = noteItem.querySelector('.copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            let text = note.text;
            let formattedText = text.replace(/<br\s*[\/]?>/gi, '\n')
              .replace(/<\/p>|<\/div>|<\/li>/gi, '\n');
            const tempElement = document.createElement("div");
            tempElement.innerHTML = formattedText;
            const plainText = (tempElement.textContent || tempElement.innerText).trim();

            navigator.clipboard.writeText(plainText).then(() => {
              copyBtn.style.color = 'darkgreen';
              setTimeout(() => copyBtn.style.color = '', 1000);
            });
          });
        }

        // Pin
        const pinBtn = noteItem.querySelector('.pin-btn');
        if (pinBtn) {
          pinBtn.addEventListener('click', () => {
            chrome.storage.local.get(["notes"], (result) => {
              let notes = result.notes || [];
              notes = notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n);
              chrome.storage.local.set({ notes }, () => {
                loadNotes();
              });
            });
          });
        }

        // Delete
        const deleteBtn = noteItem.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            chrome.storage.local.get(["notes"], (result) => {
              let notes = result.notes || [];
              notes = notes.map(n => n.id === note.id ? { ...n, deleted: true } : n);
              chrome.storage.local.set({ notes }, () => {
                loadNotes();
              });
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
      const tempDiv = document.createElement('div');
      
      const currentUrl = window.location.origin;
      const filtered = allNotes.filter(note => {
        if (note.deleted) return false;
        if (note.url && note.url !== currentUrl) return false;
        // Extract plain text to avoid matching base64 image strings
        tempDiv.innerHTML = note.text;
        return tempDiv.textContent.toLowerCase().includes(searchText);
      });
      displayNotes(filtered);
    });

    // Save / Create note
    saveBtn.addEventListener('click', () => {
      const content = editor.innerHTML.trim();
      if (!content) return;

      chrome.storage.local.get(["notes"], (result) => {
        let notes = result.notes || [];
        if (editingNoteId) {
          notes = notes.map(note => note.id === editingNoteId ? { ...note, text: content, ...(isUrlSpecific ? { url: window.location.origin } : {}) } : note);
          editingNoteId = null;
          saveBtn.innerText = "Save Note";
        } else {
          const newNote = { id: Date.now(), text: content, date: new Date().toISOString(), deleted: false };
          if (isUrlSpecific) newNote.url = window.location.origin;
          notes.unshift(newNote);
        }
        chrome.storage.local.set({ notes }, () => {
          editor.innerHTML = '';
          loadNotes();
        });
      });
    });



    // Toggle sidebar
    openBtn.addEventListener('click', () => { sidebar.style.display = 'block'; sidebar.style.right = '0'; loadNotes(); });
    closeBtn.addEventListener('click', () => { sidebar.style.right = '-50rem'; setTimeout(() => { sidebar.style.display = 'none'; }, 300); });
  }
});