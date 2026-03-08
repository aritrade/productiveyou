const NON_NEGOTIABLES = [
  { id: "no-smoking", label: "No Smoking", emoji: "🚭" },
  { id: "no-drinking", label: "No Drinking", emoji: "🚫" },
  { id: "no-addiction", label: "No Addiction", emoji: "🧠" },
  { id: "no-social-media", label: "No Social Media Screen Time", emoji: "📵" },
];

const HABITS = [
  { id: "wake-up", label: "Wake Up 5–6 AM", emoji: "⏰" },
  { id: "bed-time", label: "Sleep by 10 PM", emoji: "🌙" },
  { id: "water", label: "3L Water", emoji: "💧" },
  { id: "workout", label: "Workout", emoji: "💪" },
  { id: "meditation", label: "10min Meditation", emoji: "🧘" },
  { id: "reading", label: "Read 30min", emoji: "📖" },
  { id: "cold-shower", label: "Cold Shower", emoji: "🚿" },
  { id: "journaling", label: "Journal Entry", emoji: "✍️" },
  { id: "healthy-eating", label: "Clean Eating", emoji: "🥗" },
  { id: "skill-work", label: "Skill Building 1hr", emoji: "🎯" },
  { id: "no-junk", label: "No Junk Food", emoji: "🚫" },
  { id: "gratitude", label: "Gratitude Practice", emoji: "🙏" },
];

const TOTAL_ITEMS = NON_NEGOTIABLES.length + HABITS.length;

function loadData(key, fallback) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] !== undefined ? result[key] : fallback);
    });
  });
}

function saveData(key, value) {
  chrome.storage.local.set({ [key]: value });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function createCheckItem(item, isChecked, isNonNeg, onClick) {
  const div = document.createElement("div");
  div.className = `check-item ${isChecked ? "checked" : ""} ${isNonNeg && !isChecked ? "non-neg unchecked" : ""}`;
  div.innerHTML = `
    <div class="check-icon">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 13l4 4L19 7"/>
      </svg>
    </div>
    <span class="check-emoji">${item.emoji || item.icon}</span>
    <span class="check-label">${item.label}</span>
  `;
  div.addEventListener("click", onClick);
  return div;
}

function updatePercentage(nonNeg, habits) {
  const nonNegCount = Object.values(nonNeg).filter(Boolean).length;
  const habitCount = Object.values(habits).filter(Boolean).length;
  const pct = Math.round(((nonNegCount + habitCount) / TOTAL_ITEMS) * 100);

  const badge = document.getElementById("todayBadge");
  badge.textContent = `${pct}%`;
  badge.className = `today-badge ${pct >= 90 ? "success" : ""}`;

  // Save to history
  loadData("monkmode-history", []).then((history) => {
    const today = todayStr();
    const idx = history.findIndex((d) => d.date === today);
    if (idx >= 0) {
      history[idx].percentage = pct;
    } else {
      history.push({ date: today, percentage: pct });
    }
    saveData("monkmode-history", history);

    // Calculate streak
    const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 730; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const rec = sorted.find((r) => r.date === ds);
      if (rec && rec.percentage >= 90) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    document.getElementById("streakValue").textContent = `${streak} day${streak !== 1 ? "s" : ""}`;
  });
}

async function init() {
  const nonNeg = await loadData("monkmode-nonneg", {});
  const habits = await loadData("monkmode-habits", {});

  const nonNegList = document.getElementById("nonNegList");
  const habitList = document.getElementById("habitList");

  NON_NEGOTIABLES.forEach((item) => {
    const el = createCheckItem(item, !!nonNeg[item.id], true, () => {
      nonNeg[item.id] = !nonNeg[item.id];
      saveData("monkmode-nonneg", nonNeg);
      render();
    });
    nonNegList.appendChild(el);
  });

  HABITS.forEach((item) => {
    const el = createCheckItem(item, !!habits[item.id], false, () => {
      habits[item.id] = !habits[item.id];
      saveData("monkmode-habits", habits);
      render();
    });
    habitList.appendChild(el);
  });

  function render() {
    nonNegList.innerHTML = "";
    habitList.innerHTML = "";
    NON_NEGOTIABLES.forEach((item) => {
      nonNegList.appendChild(
        createCheckItem(item, !!nonNeg[item.id], true, () => {
          nonNeg[item.id] = !nonNeg[item.id];
          saveData("monkmode-nonneg", nonNeg);
          render();
        })
      );
    });
    HABITS.forEach((item) => {
      habitList.appendChild(
        createCheckItem(item, !!habits[item.id], false, () => {
          habits[item.id] = !habits[item.id];
          saveData("monkmode-habits", habits);
          render();
        })
      );
    });
    updatePercentage(nonNeg, habits);
  }

  updatePercentage(nonNeg, habits);
}

init();
