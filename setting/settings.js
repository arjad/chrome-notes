document.addEventListener("DOMContentLoaded", function () {
  // dark mode logic
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  // Check and apply dark mode setting on load
  chrome.storage.sync.get("darkMode", function (data) {
    if (data.darkMode) {
      darkModeToggle.checked = true;
      document.body.classList.add("dark-mode");
    }
  });

  // Handle dark mode toggle
  darkModeToggle.addEventListener("change", function () {
    const isDarkMode = darkModeToggle.checked;

    // Save setting
    chrome.storage.sync.set({ darkMode: isDarkMode });

    // Apply dark mode
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  });

  // sorting logic
  const sorting_options = document.getElementById("sort-options");

  // Load saved sort preference
  chrome.storage.sync.get("sort_value", function (data) {
    if (data.sort_value) {
      sorting_options.value = data.sort_value;
    }
  });

  sorting_options.addEventListener("change", function () {
    chrome.storage.sync.set({ sort_value: sorting_options.value });
  });
});
