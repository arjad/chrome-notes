chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarm triggered:", alarm.name);
  
  chrome.notifications.create({
    type: "basic",
    iconUrl: "/assets/note.png",
    title: "Alarm Triggered!",
    message: `Alarm "${alarm.name}" fired at ${new Date().toLocaleTimeString()}`,
    silent: false
  });

  chrome.tabs.create({
    url: 'https://c4.wallpaperflare.com/wallpaper/853/914/400/clocks-suits-men-time-wallpaper-preview.jpg?alarmName=${encodeURIComponent(alarm.name)',
  });
});
