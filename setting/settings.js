document.addEventListener('DOMContentLoaded', function () {
  // dark mode logic
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  chrome.storage.sync.get('darkMode', function (data) {
    if (data.darkMode) {
      darkModeToggle.checked = true;
      document.body.classList.add('dark-mode');
    }
  });

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

  // sorting logic
  const sorting_options = document.getElementById('sort-options');
  sorting_options.addEventListener('change', function () {
    chrome.storage.sync.set({ sort_value: sorting_options.value });
  });
});
