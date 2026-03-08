// Set up periodic reminders
chrome.runtime.onInstalled.addListener(() => {
  // Morning reminder at 6 AM
  chrome.alarms.create("morning-reminder", {
    when: getNextAlarmTime(6, 0),
    periodInMinutes: 24 * 60,
  });

  // Midday check-in at 12 PM
  chrome.alarms.create("midday-reminder", {
    when: getNextAlarmTime(12, 0),
    periodInMinutes: 24 * 60,
  });

  // Evening reminder at 8 PM
  chrome.alarms.create("evening-reminder", {
    when: getNextAlarmTime(20, 0),
    periodInMinutes: 24 * 60,
  });

  // Hourly focus nudge (every 2 hours during work hours)
  chrome.alarms.create("focus-nudge", {
    delayInMinutes: 120,
    periodInMinutes: 120,
  });
});

function getNextAlarmTime(hour, minute) {
  const now = new Date();
  const alarm = new Date();
  alarm.setHours(hour, minute, 0, 0);
  if (alarm <= now) {
    alarm.setDate(alarm.getDate() + 1);
  }
  return alarm.getTime();
}

const MESSAGES = {
  "morning-reminder": {
    title: "⚡ Monk Mode — Rise & Grind",
    message: "New day, new opportunity. Open your tracker and start checking off those habits!",
  },
  "midday-reminder": {
    title: "🔥 Monk Mode — Midday Check",
    message: "How's your progress? You're halfway through the day. Keep pushing!",
  },
  "evening-reminder": {
    title: "🌙 Monk Mode — Evening Review",
    message: "Day's almost done. Complete your remaining habits and journal your wins.",
  },
  "focus-nudge": {
    title: "🧠 Stay Focused",
    message: "Are you on track? Quick check: no distractions, stay in monk mode.",
  },
};

chrome.alarms.onAlarm.addListener((alarm) => {
  const msg = MESSAGES[alarm.name];
  if (!msg) return;

  // For focus nudge, only show during work hours (6 AM - 10 PM)
  if (alarm.name === "focus-nudge") {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 22) return;
  }

  // Check today's progress before sending notification
  chrome.storage.local.get(["monkmode-nonneg", "monkmode-habits"], (data) => {
    const nonNeg = data["monkmode-nonneg"] || {};
    const habits = data["monkmode-habits"] || {};
    const total = 16;
    const done = Object.values(nonNeg).filter(Boolean).length + Object.values(habits).filter(Boolean).length;
    const pct = Math.round((done / total) * 100);

    let finalMessage = msg.message;
    if (pct > 0) {
      finalMessage += ` (Today: ${pct}%)`;
    }

    chrome.notifications.create(alarm.name, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: msg.title,
      message: finalMessage,
    });
  });
});

// Open popup when notification clicked
chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup();
});

// Reset daily data at midnight
chrome.alarms.create("daily-reset", {
  when: getNextAlarmTime(0, 1),
  periodInMinutes: 24 * 60,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "daily-reset") {
    // Save yesterday's progress to history, then reset
    chrome.storage.local.get(["monkmode-nonneg", "monkmode-habits", "monkmode-history"], (data) => {
      const history = data["monkmode-history"] || [];
      // Reset checkboxes for the new day
      chrome.storage.local.set({
        "monkmode-nonneg": {},
        "monkmode-habits": {},
        "monkmode-history": history,
      });
    });
  }
});
