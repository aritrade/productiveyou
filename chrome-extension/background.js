// Set up periodic reminders + daily reset alarm. All alarm setup is funneled
// through a single helper so the MV3 service worker re-creates them on every
// install / browser-start cycle.
chrome.runtime.onInstalled.addListener(setupAlarms);
chrome.runtime.onStartup.addListener(setupAlarms);

function setupAlarms() {
  chrome.alarms.create("morning-reminder", {
    when: getNextAlarmTime(6, 0),
    periodInMinutes: 24 * 60,
  });
  chrome.alarms.create("midday-reminder", {
    when: getNextAlarmTime(12, 0),
    periodInMinutes: 24 * 60,
  });
  chrome.alarms.create("evening-reminder", {
    when: getNextAlarmTime(20, 0),
    periodInMinutes: 24 * 60,
  });
  // Focus nudge every 2 hours, gated to work hours (6 AM – 10 PM) in the handler
  chrome.alarms.create("focus-nudge", {
    delayInMinutes: 120,
    periodInMinutes: 120,
  });
  // Midnight reset — write at 00:01 local time
  chrome.alarms.create("daily-reset", {
    when: getNextAlarmTime(0, 1),
    periodInMinutes: 24 * 60,
  });
}

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

// Single alarm dispatcher — handles notifications + daily reset
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "daily-reset") {
    handleDailyReset();
    return;
  }

  const msg = MESSAGES[alarm.name];
  if (!msg) return;

  // Focus nudges only fire during work hours (6 AM – 10 PM local time)
  if (alarm.name === "focus-nudge") {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 22) return;
  }

  chrome.storage.local.get(["monkmode-nonneg", "monkmode-habits"], (data) => {
    const nonNeg = data["monkmode-nonneg"] || {};
    const habits = data["monkmode-habits"] || {};
    const total = 16;
    const done = Object.values(nonNeg).filter(Boolean).length + Object.values(habits).filter(Boolean).length;
    const pct = Math.round((done / total) * 100);
    const finalMessage = pct > 0 ? `${msg.message} (Today: ${pct}%)` : msg.message;

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

function handleDailyReset() {
  // Snapshot yesterday's completion into history before clearing checkboxes
  chrome.storage.local.get(
    ["monkmode-nonneg", "monkmode-habits", "monkmode-history"],
    (data) => {
      const nonNeg = data["monkmode-nonneg"] || {};
      const habits = data["monkmode-habits"] || {};
      const history = data["monkmode-history"] || [];
      const total = 16;
      const done = Object.values(nonNeg).filter(Boolean).length + Object.values(habits).filter(Boolean).length;
      const pct = Math.round((done / total) * 100);

      // Yesterday's date — alarm fires at 00:01 so "yesterday" is fresh
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterdayStr = y.toISOString().split("T")[0];

      const idx = history.findIndex((d) => d.date === yesterdayStr);
      if (idx >= 0) history[idx].percentage = pct;
      else history.push({ date: yesterdayStr, percentage: pct });

      chrome.storage.local.set({
        "monkmode-nonneg": {},
        "monkmode-habits": {},
        "monkmode-history": history,
      });
    }
  );
}
