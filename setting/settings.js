document.addEventListener('DOMContentLoaded', function () {
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  // Load the stored dark mode preference
  chrome.storage.sync.get('darkMode', function (data) {
    if (data.darkMode) {
      darkModeToggle.checked = true;
      document.body.classList.add('dark-mode');
    }
  });

  // Toggle dark mode
  darkModeToggle.addEventListener('change', function () {
    const isDarkMode = darkModeToggle.checked;
    const noteInput = document.getElementById('note-input')
    // Save setting
    chrome.storage.sync.set({ darkMode: isDarkMode });
  
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      if (noteInput) {
        document.getElementById('note-input').classList.add('text-white');
        document.getElementById('note-input').classList.remove('text-dark');
      }
    } else {
      document.body.classList.remove('dark-mode');
      if (noteInput) {
        document.getElementById('note-input').classList.add('text-dark');
        document.getElementById('note-input').classList.remove('text-white');
      }
    }
  });
});
