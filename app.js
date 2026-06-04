const STORAGE_KEY = "calorie-pwa-state-v1";

const defaultState = {
  profile: {
    sex: "male",
    age: 28,
    height: 175,
    weight: 70,
    activity: 1.55,
    goal: 0,
    manualTarget: ""
  },
  entriesByDate: {}
};

let state = loadState();
let currentDate = todayKey();

const $ = (selector) => document.querySelector(selector);
const elements = {
  backupButton: $("#backupButton"),
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  dateInput: $("#dateInput"),
  prevDay: $("#prevDay"),
  nextDay: $("#nextDay"),
  remainingKcal: $("#remainingKcal"),
  targetKcal: $("#targetKcal"),
  eatenKcal: $("#eatenKcal"),
  kcalRing: $("#kcalRing"),
  kcalPercent: $("#kcalPercent"),
  proteinMeter: $("#proteinMeter"),
  carbMeter: $("#carbMeter"),
  fatMeter: $("#fatMeter"),
  proteinText: $("#proteinText"),
  carbText: $("#carbText"),
  fatText: $("#fatText"),
  foodForm: $("#foodForm"),
  quickClear: $("#quickClear"),
  entryList: $("#entryList"),
  emptyState: $("#emptyState"),
  clearDay: $("#clearDay"),
  profileForm: $("#profileForm"),
  bmrText: $("#bmrText"),
  sex: $("#sex"),
  age: $("#age"),
  height: $("#height"),
  weight: $("#weight"),
  activity: $("#activity"),
  goal: $("#goal"),
  manualTarget: $("#manualTarget"),
  historyChart: $("#historyChart"),
  averageText: $("#averageText"),
  resetAll: $("#resetAll"),
  importFile: $("#importFile")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return cloneDefaultState();
    return {
      ...cloneDefaultState(),
      ...saved,
      profile: { ...defaultState.profile, ...saved.profile },
      entriesByDate: saved.entriesByDate || {}
    };
  } catch {
    return cloneDefaultState();
  }
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function round(value) {
  return Math.round(Number(value) || 0);
}

function roundOne(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function getProfileNumbers() {
  const profile = state.profile;
  return {
    sex: profile.sex,
    age: Number(profile.age) || 0,
    height: Number(profile.height) || 0,
    weight: Number(profile.weight) || 0,
    activity: Number(profile.activity) || 1.2,
    goal: Number(profile.goal) || 0,
    manualTarget: Number(profile.manualTarget) || 0
  };
}

function calculateTargets() {
  const profile = getProfileNumbers();
  const sexOffset = profile.sex === "male" ? 5 : -161;
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexOffset;
  const tdee = bmr * profile.activity;
  const target = profile.manualTarget > 0 ? profile.manualTarget : tdee + profile.goal;
  const protein = profile.weight * 1.6;
  const fat = profile.weight * 0.8;
  const carb = Math.max((target - protein * 4 - fat * 9) / 4, 0);

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    calories: round(target),
    macros: {
      protein: roundOne(protein),
      carb: roundOne(carb),
      fat: roundOne(fat)
    }
  };
}

function getEntries(dateKey = currentDate) {
  return state.entriesByDate[dateKey] || [];
}

function getTotals(dateKey = currentDate) {
  return getEntries(dateKey).reduce(
    (totals, entry) => {
      totals.kcal += Number(entry.kcal) || 0;
      totals.protein += Number(entry.protein) || 0;
      totals.carb += Number(entry.carb) || 0;
      totals.fat += Number(entry.fat) || 0;
      return totals;
    },
    { kcal: 0, protein: 0, carb: 0, fat: 0 }
  );
}

function setMeter(meter, text, value, target, unit = "g") {
  const percent = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  meter.value = percent;
  text.textContent = `${roundOne(value)} / ${roundOne(target)} ${unit}`;
}

function renderSummary() {
  const targets = calculateTargets();
  const totals = getTotals();
  const remaining = targets.calories - totals.kcal;
  const progress = targets.calories > 0 ? Math.min(totals.kcal / targets.calories, 1) : 0;
  const degrees = Math.round(progress * 360);

  elements.remainingKcal.textContent = round(remaining);
  elements.targetKcal.textContent = targets.calories;
  elements.eatenKcal.textContent = round(totals.kcal);
  elements.kcalPercent.textContent = `${Math.round(progress * 100)}%`;
  elements.kcalRing.style.background = `conic-gradient(var(--teal) ${degrees}deg, var(--line) ${degrees}deg)`;

  setMeter(elements.proteinMeter, elements.proteinText, totals.protein, targets.macros.protein);
  setMeter(elements.carbMeter, elements.carbText, totals.carb, targets.macros.carb);
  setMeter(elements.fatMeter, elements.fatText, totals.fat, targets.macros.fat);
  elements.bmrText.textContent = `BMR ${targets.bmr} · TDEE ${targets.tdee}`;
}

function renderEntries() {
  const entries = getEntries();
  elements.entryList.replaceChildren();
  elements.emptyState.classList.toggle("active", entries.length === 0);

  entries.forEach((entry) => {
    const node = $("#entryTemplate").content.firstElementChild.cloneNode(true);
    node.querySelector(".meal-pill").textContent = entry.meal;
    node.querySelector(".entry-main strong").textContent = entry.name;
    node.querySelector(".entry-main small").textContent =
      `蛋白 ${roundOne(entry.protein)}g · 碳水 ${roundOne(entry.carb)}g · 脂肪 ${roundOne(entry.fat)}g`;
    node.querySelector(".entry-kcal").textContent = `${round(entry.kcal)} kcal`;
    node.querySelector("button").addEventListener("click", () => removeEntry(entry.id));
    elements.entryList.append(node);
  });
}

function renderProfileForm() {
  const profile = state.profile;
  elements.sex.value = profile.sex;
  elements.age.value = profile.age;
  elements.height.value = profile.height;
  elements.weight.value = profile.weight;
  elements.activity.value = String(profile.activity);
  elements.goal.value = String(profile.goal);
  elements.manualTarget.value = profile.manualTarget;
}

function renderHistory() {
  const targets = calculateTargets();
  const dates = Array.from({ length: 7 }, (_, index) => addDays(currentDate, index - 6));
  const totals = dates.map((date) => ({ date, kcal: getTotals(date).kcal }));
  const maxValue = Math.max(targets.calories, ...totals.map((item) => item.kcal), 1);
  const average = totals.reduce((sum, item) => sum + item.kcal, 0) / totals.length;

  elements.averageText.textContent = `平均 ${round(average)} kcal`;
  elements.historyChart.replaceChildren();

  totals.forEach((item) => {
    const wrap = document.createElement("div");
    const bar = document.createElement("div");
    const value = document.createElement("strong");
    const label = document.createElement("span");
    const height = Math.max((item.kcal / maxValue) * 138, 6);
    const difference = item.kcal - targets.calories;

    wrap.className = "bar-wrap";
    bar.className = `bar ${difference > 100 ? "over" : difference < -100 ? "under" : ""}`;
    bar.style.height = `${height}px`;
    value.textContent = round(item.kcal);
    label.textContent = item.date.slice(5).replace("-", "/");

    wrap.append(bar, value, label);
    elements.historyChart.append(wrap);
  });
}

function render() {
  elements.dateInput.value = currentDate;
  renderSummary();
  renderEntries();
  renderProfileForm();
  renderHistory();
}

function addEntry(formData) {
  const entry = {
    id: createId(),
    name: formData.get("name")?.trim() || "未命名",
    meal: formData.get("meal") || "加餐",
    kcal: Number(formData.get("kcal")) || 0,
    protein: Number(formData.get("protein")) || 0,
    carb: Number(formData.get("carb")) || 0,
    fat: Number(formData.get("fat")) || 0,
    createdAt: new Date().toISOString()
  };

  state.entriesByDate[currentDate] = [...getEntries(), entry];
  saveState();
  elements.foodForm.reset();
  $("#mealType").value = entry.meal;
  render();
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function removeEntry(id) {
  state.entriesByDate[currentDate] = getEntries().filter((entry) => entry.id !== id);
  saveState();
  render();
}

function clearFoodForm() {
  elements.foodForm.reset();
  $("#mealType").value = "午餐";
}

function switchTab(tabName) {
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  elements.views.forEach((view) => view.classList.remove("active"));
  $(`#${tabName}View`).classList.add("active");
}

function downloadBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "calorie-pwa",
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `calorie-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(reader.result);
      const importedState = payload.state || payload;
      if (!importedState.profile || !importedState.entriesByDate) {
        throw new Error("Invalid backup");
      }
      state = {
        ...cloneDefaultState(),
        ...importedState,
        profile: { ...defaultState.profile, ...importedState.profile },
        entriesByDate: importedState.entriesByDate
      };
      saveState();
      render();
    } catch {
      alert("备份文件无法识别");
    }
  });
  reader.readAsText(file);
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

elements.prevDay.addEventListener("click", () => {
  currentDate = addDays(currentDate, -1);
  render();
});

elements.nextDay.addEventListener("click", () => {
  currentDate = addDays(currentDate, 1);
  render();
});

elements.dateInput.addEventListener("change", (event) => {
  currentDate = event.target.value || todayKey();
  render();
});

elements.foodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(elements.foodForm);
  data.set("name", $("#foodName").value);
  data.set("meal", $("#mealType").value);
  data.set("kcal", $("#foodKcal").value);
  data.set("protein", $("#foodProtein").value);
  data.set("carb", $("#foodCarb").value);
  data.set("fat", $("#foodFat").value);
  addEntry(data);
});

elements.quickClear.addEventListener("click", clearFoodForm);

elements.clearDay.addEventListener("click", () => {
  if (!getEntries().length || !confirm("清空当天所有记录？")) return;
  delete state.entriesByDate[currentDate];
  saveState();
  render();
});

elements.profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.profile = {
    sex: elements.sex.value,
    age: Number(elements.age.value) || defaultState.profile.age,
    height: Number(elements.height.value) || defaultState.profile.height,
    weight: Number(elements.weight.value) || defaultState.profile.weight,
    activity: Number(elements.activity.value) || defaultState.profile.activity,
    goal: Number(elements.goal.value) || 0,
    manualTarget: elements.manualTarget.value
  };
  saveState();
  render();
  switchTab("log");
});

elements.backupButton.addEventListener("click", downloadBackup);

elements.resetAll.addEventListener("click", () => {
  if (!confirm("重置全部资料和记录？")) return;
  state = cloneDefaultState();
  currentDate = todayKey();
  saveState();
  render();
});

elements.importFile.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importBackup(file);
  event.target.value = "";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

render();
