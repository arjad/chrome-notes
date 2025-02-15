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
    const noteInput = document.querySelectorAll('.input-tag')
    // Save setting
    chrome.storage.sync.set({ darkMode: isDarkMode });
    console.log("negth = " + noteInput.length)

    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      if (noteInput) {
        console.log("dark mode on ")
        document.querySelectorAll('.input-tag').forEach(element => {
          element.classList.remove('text-dark');
        });
      }
    } else {
      document.body.classList.remove('dark-mode');
      if (noteInput) {
        document.querySelectorAll('.input-tag').forEach(element => {
          element.classList.remove('text-white');
        });
      }
    }
  });
});
