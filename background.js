chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveQuickNote",
    title: "Save as Quick Note",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveQuickNote") {
    const selectedText = info.selectionText;
    if (selectedText) {
      chrome.storage.sync.get(['notes'], function (result) {
        const notes = result.notes || [];
        const newNote = {
          id: Date.now(),
          text: selectedText,
          date: new Date().toLocaleDateString('en-US'),
          pinned: false
        };
        notes.push(newNote);

        chrome.storage.sync.set({ notes: notes }, function () {
          console.log("Quick Note saved:", selectedText);
        });
      });
    }
  }
});
