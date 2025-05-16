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
