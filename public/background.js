// alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarm triggered:", alarm.name);
  
  chrome.notifications.create({
    type: "basic",
    iconUrl: "/assets/note.png",
    title: "Alarm Triggered!",
    message: `Alarm "${alarm.name}" fired at ${new Date().toLocaleTimeString()}`,
    silent: false
  });

   chrome.windows.create({
    url: chrome.runtime.getURL("alarm.html"),
    type: "popup",
    width: 400,
    height: 300
  });

});

// welcome note
chrome.runtime.onInstalled.addListener(() => {
  console.log("I Notes extension installed");
  
  chrome.contextMenus.create({
    id: "add-inote",
    title: "Add this text as note in iNotes",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "add-inote" && info.selectionText) {
    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      const newNote = {
        id: Date.now().toString(),
        text: `<div>${info.selectionText}</div>`,
        date: new Date().toISOString(),
        pinned: false,
      };
      
      const updatedNotes = [newNote, ...notes];
      chrome.storage.local.set({ notes: updatedNotes }, () => {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "/assets/note.png",
          title: "i Notes",
          message: "Note saved successfully!",
          silent: true
        });
      });
    });
  }
});

// google auth
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startGoogleLogin") {
    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;
    const redirectUri = chrome.identity.getRedirectURL();
    const scopes = ["profile", "email"].join(" ");

    const authUrl =
      `https://accounts.google.com/o/oauth2/auth` +
      `?client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          console.error("Login failed:", chrome.runtime.lastError);
          return;
        }

        const urlFragment = new URLSearchParams(redirectUrl.split("#")[1]);
        const accessToken = urlFragment.get("access_token");

        if (!accessToken) {
          console.error("No access token found.");
          return;
        }

        // Fetch user profile using the access token
        fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then((res) => res.json())
          .then((profile) => {
            chrome.storage.local.set({ userProfile: profile }, () => {
              console.log("User profile saved.");
            });
            chrome.runtime.sendMessage({ action: "refreshPopup" });
          })
          .catch((error) => {
            console.error("Failed to fetch user profile:", error);
          });
      }
    );
  } else if (message.action === "openTab" && message.url) {
    chrome.tabs.create({ url: message.url });
  }
});
