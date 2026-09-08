const STORAGE_KEY = "my-meal-diary.entries.v1";

const mealTypeNames = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

const moods = {
  happy: {
    label: "とてもおいしい",
    face: "🤩",
    score: 5,
  },
  good: {
    label: "おいしい",
    face: "😋",
    score: 4,
  },
  normal: {
    label: "普通",
    face: "🙂",
    score: 3,
  },
  okay: {
    label: "少し物足りない",
    face: "😐",
    score: 2,
  },
  sad: {
    label: "残念",
    face: "😕",
    score: 1,
  },
};

const form = document.querySelector("#diary-form");
const dateInput = document.querySelector("#entry-date");
const mealTypeInput = document.querySelector("#meal-type");
const mealNameInput = document.querySelector("#meal-name");
const noteInput = document.querySelector("#entry-note");
const clearButton = document.querySelector("#clear-button");
const entryList = document.querySelector("#entry-list");
const emptyState = document.querySelector("#empty-state");
const saveState = document.querySelector("#save-state");
const charCount = document.querySelector("#char-count");
const editingLabel = document.querySelector("#editing-label");
const entryCount = document.querySelector("#entry-count");
const summaryRow = document.querySelector("#summary-row");
const searchInput = document.querySelector("#search-input");
const moodFilter = document.querySelector("#mood-filter");
const rhythmChart = document.querySelector("#rhythm-chart");
const biorhythmMessage = document.querySelector("#biorhythm-message");
const biorhythmDetail = document.querySelector("#biorhythm-detail");

let entries = loadEntries();

function loadEntries() {
  const rawEntries = localStorage.getItem(STORAGE_KEY);

  if (!rawEntries) {
    return [];
  }

  try {
    const parsedEntries = JSON.parse(rawEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getTodayIso() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function parseIsoDate(dateText) {
  return new Date(`${dateText}T00:00:00`);
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sortEntries() {
  entries.sort((a, b) => b.date.localeCompare(a.date));
}

function getSelectedMealType() {
  return mealTypeInput.value;
}

function getSelectedMood() {
  return form.elements.mood.value;
}

function setSelectedMood(mood) {
  const moodInput = form.querySelector(`input[name="mood"][value="${mood}"]`);

  if (moodInput) {
    moodInput.checked = true;
  }
}

function clearSelectedMood() {
  form.querySelectorAll('input[name="mood"]').forEach((input) => {
    input.checked = false;
  });
}

function formatDate(dateText) {
  const date = parseIsoDate(dateText);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatShortDate(dateText) {
  const date = parseIsoDate(dateText);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSearchableText(entry) {
  const mealTypeLabel = mealTypeNames[entry.mealType] ?? entry.mealType ?? "";
  return `${entry.date} ${mealTypeLabel} ${entry.mealName} ${entry.note} ${moods[entry.mood]?.label ?? ""}`.toLowerCase();
}

function getFilteredEntries() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedMood = moodFilter.value;

  return entries.filter((entry) => {
    const matchesMood = selectedMood === "all" || entry.mood === selectedMood;
    const matchesQuery = !query || getSearchableText(entry).includes(query);

    return matchesMood && matchesQuery;
  });
}

function renderEntries() {
  const filteredEntries = getFilteredEntries();

  entryList.innerHTML = filteredEntries
    .map((entry) => {
      const mood = moods[entry.mood] ?? moods.normal;
      const mealTypeLabel = mealTypeNames[entry.mealType] ?? entry.mealType;

      return `
        <li class="entry-card">
          <div class="entry-topline">
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-type-pill">${mealTypeLabel}</span>
          </div>
          <div class="entry-header">
            <strong>${escapeHtml(entry.mealName)}</strong>
            <span class="mood-badge">${mood.face} ${mood.label}</span>
          </div>
          <p class="entry-note">${escapeHtml(entry.note)}</p>
          <div class="entry-actions">
            <button type="button" data-action="edit" data-date="${entry.date}" data-meal-type="${entry.mealType}">編集</button>
            <button class="danger-button" type="button" data-action="delete" data-date="${entry.date}" data-meal-type="${entry.mealType}">削除</button>
          </div>
        </li>
      `;
    })
    .join("");

  if (entries.length > 0 && filteredEntries.length === 0) {
    emptyState.innerHTML = `
      <strong>条件に合う食事がありません</strong>
      <span>検索ワードや満足度フィルターを変えてみてください。</span>
    `;
  } else {
    emptyState.innerHTML = `
      <strong>まだ記録がありません</strong>
      <span>食事の内容と満足度を保存すると、ここに表示されます。</span>
    `;
  }

  emptyState.hidden = filteredEntries.length > 0;
  entryList.hidden = filteredEntries.length === 0;
}

function renderSummary() {
  entryCount.textContent = entries.length;

  summaryRow.innerHTML = Object.entries(moods)
    .map(([moodKey, mood]) => {
      const count = entries.filter((entry) => entry.mood === moodKey).length;
      return `<span class="summary-chip">${mood.face} ${mood.label} ${count}</span>`;
    })
    .join("");
}

function renderBiorhythm() {
  if (entries.length === 0) {
    rhythmChart.innerHTML = "";
    biorhythmMessage.textContent = "食事の満足度を記録すると表示されます";
    biorhythmDetail.textContent = "最近7件の食事の満足度の変化を表示します。";
    return;
  }

  const recentEntries = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .reverse();
  const totalScore = recentEntries.reduce((sum, entry) => {
    return sum + (moods[entry.mood]?.score ?? moods.normal.score);
  }, 0);
  const average = totalScore / recentEntries.length;
  const firstScore = moods[recentEntries[0].mood]?.score ?? moods.normal.score;
  const lastEntry = recentEntries[recentEntries.length - 1];
  const lastScore = moods[lastEntry.mood]?.score ?? moods.normal.score;
  const trend = lastScore - firstScore;

  rhythmChart.innerHTML = createBiorhythmSvg(recentEntries);

  biorhythmMessage.textContent = getBiorhythmMessage(trend, average, recentEntries.length);
  biorhythmDetail.textContent = `最近${recentEntries.length}件の平均: ${average.toFixed(1)} / 5`;
}

function createBiorhythmSvg(recentEntries) {
  const width = 360;
  const height = 170;
  const padding = {
    top: 22,
    right: 18,
    bottom: 34,
    left: 28,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const points = recentEntries.map((entry, index) => {
    const mood = moods[entry.mood] ?? moods.normal;
    const x =
      recentEntries.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (chartWidth / (recentEntries.length - 1)) * index;
    const y = padding.top + ((5 - mood.score) / 4) * chartHeight;

    return {
      x,
      y,
      entry,
      mood,
    };
  });
  const lastPoint = points[points.length - 1];
  const lineShape =
    points.length === 1
      ? buildSinglePointWave(points[0], chartWidth)
      : {
          path: buildSmoothPath(points),
          startX: points[0].x,
          endX: lastPoint.x,
        };
  const areaPath = `${lineShape.path} L ${lineShape.endX} ${height - padding.bottom} L ${
    lineShape.startX
  } ${height - padding.bottom} Z`;

  return `
    <svg
      class="rhythm-svg"
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="最近${recentEntries.length}件の満足度の流れ"
    >
      <defs>
        <linearGradient id="rhythm-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="45%" stop-color="#84cc16" />
          <stop offset="75%" stop-color="#2dd4bf" />
          <stop offset="100%" stop-color="#f97316" />
        </linearGradient>
        <linearGradient id="rhythm-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#f97316" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      <g class="rhythm-grid" aria-hidden="true">
        <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" />
        <line x1="${padding.left}" y1="${padding.top + chartHeight / 2}" x2="${
          width - padding.right
        }" y2="${padding.top + chartHeight / 2}" />
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${
          height - padding.bottom
        }" />
      </g>
      <path class="rhythm-area" d="${areaPath}" aria-hidden="true"></path>
      <path class="rhythm-wave" d="${lineShape.path}" aria-hidden="true"></path>
      ${points
        .map((point) => {
          return `
            <g class="rhythm-point">
              <circle cx="${point.x}" cy="${point.y}" r="4.6"></circle>
              <text x="${point.x}" y="${point.y - 10}" text-anchor="middle">${point.mood.face}</text>
              <text class="rhythm-axis-label" x="${point.x}" y="${height - 10}" text-anchor="middle">${formatShortDate(
                point.entry.date,
              )}</text>
            </g>
          `;
        })
        .join("")}
    </svg>
  `;
}

function buildSmoothPath(points) {
  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previousPoint = points[index - 1];
    const controlX = (previousPoint.x + point.x) / 2;
    return `${path} C ${controlX} ${previousPoint.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function buildSinglePointWave(point, chartWidth) {
  const waveWidth = chartWidth * 0.56;
  const startX = point.x - waveWidth / 2;
  const endX = point.x + waveWidth / 2;
  const lift = 24;

  return {
    path: `M ${startX} ${point.y} C ${startX + waveWidth * 0.25} ${point.y - lift}, ${
      startX + waveWidth * 0.75
    } ${point.y + lift}, ${endX} ${point.y}`,
    startX,
    endX,
  };
}

function getBiorhythmMessage(trend, average, entryLength) {
  if (entryLength === 1) {
    return "最初の食事を記録しました";
  }

  if (trend >= 2) {
    return "食事の満足度が上向き";
  }

  if (trend >= 0.5) {
    return "少し良い流れ";
  }

  if (trend <= -2) {
    return "食事の満足度が低め";
  }

  if (trend <= -0.5) {
    return "少し落ち気味";
  }

  if (average >= 4) {
    return "安定しておいしい食事が多い";
  }

  if (average <= 2.2) {
    return "食事のバランスを見直したい日";
  }

  return "安定した満足度";
}

function render() {
  sortEntries();
  renderSummary();
  renderBiorhythm();
  renderEntries();
}

function resetForm() {
  form.reset();
  dateInput.value = getTodayIso();
  mealTypeInput.value = "breakfast";
  clearSelectedMood();
  mealNameInput.value = "";
  noteInput.value = "";
  editingLabel.textContent = "今日の食事を記録しています";
  updateCharCount();
  updateSaveState("未保存");
}

function updateCharCount() {
  charCount.textContent = noteInput.value.length;
}

function updateSaveState(text) {
  saveState.textContent = text;
}

function loadEntryIntoForm(entry) {
  dateInput.value = entry.date;
  mealTypeInput.value = entry.mealType;
  mealNameInput.value = entry.mealName;
  setSelectedMood(entry.mood);
  noteInput.value = entry.note;
  editingLabel.textContent = `${formatDate(entry.date)}の${mealTypeNames[entry.mealType] ?? entry.mealType}を編集中`;
  updateCharCount();
  updateSaveState("編集中");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = dateInput.value;
  const mealType = getSelectedMealType();
  const mealName = mealNameInput.value.trim();
  const mood = getSelectedMood();
  const note = noteInput.value.trim();

  if (!date || !mealType || !mealName || !mood || !note) {
    updateSaveState("入力を確認");
    return;
  }

  const existingIndex = entries.findIndex((entry) => entry.date === date && entry.mealType === mealType);
  const now = new Date().toISOString();
  const nextEntry = {
    id: existingIndex >= 0 ? entries[existingIndex].id : createId(),
    date,
    mealType,
    mealName,
    mood,
    note,
    createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = nextEntry;
  } else {
    entries.push(nextEntry);
  }

  saveEntries();
  render();
  loadEntryIntoForm(nextEntry);
  updateSaveState("保存済み");
});

function refreshFormForSelectedMeal() {
  const date = dateInput.value;
  if (!date) {
    return;
  }

  const existingEntry = entries.find((entry) => entry.date === date && entry.mealType === mealTypeInput.value);

  if (existingEntry) {
    loadEntryIntoForm(existingEntry);
    return;
  }

  clearSelectedMood();
  mealNameInput.value = "";
  noteInput.value = "";
  editingLabel.textContent = `${formatDate(date)}の${mealTypeNames[mealTypeInput.value]}を記録しています`;
  updateCharCount();
  updateSaveState("未保存");
}

dateInput.addEventListener("change", refreshFormForSelectedMeal);
mealTypeInput.addEventListener("change", refreshFormForSelectedMeal);

mealNameInput.addEventListener("input", () => {
  updateSaveState("編集中");
});

noteInput.addEventListener("input", () => {
  updateCharCount();
  updateSaveState("編集中");
});

form.querySelector("#mood-grid").addEventListener("change", () => {
  updateSaveState("編集中");
});

clearButton.addEventListener("click", () => {
  resetForm();
});

entryList.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const entryDate = button.dataset.date;
  const mealType = button.dataset.mealType;
  const entry = entries.find((item) => item.date === entryDate && item.mealType === mealType);

  if (!entry) {
    return;
  }

  if (button.dataset.action === "edit") {
    loadEntryIntoForm(entry);
    document.querySelector(".editor-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (button.dataset.action === "delete") {
    const shouldDelete = confirm(`${formatDate(entry.date)}の${mealTypeNames[entry.mealType]}を削除しますか？`);

    if (!shouldDelete) {
      return;
    }

    entries = entries.filter((item) => !(item.date === entry.date && item.mealType === entry.mealType));
    saveEntries();
    render();
    resetForm();
  }
});

searchInput.addEventListener("input", renderEntries);
moodFilter.addEventListener("change", renderEntries);

dateInput.value = getTodayIso();
mealTypeInput.value = "breakfast";
updateCharCount();
render();
