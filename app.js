const STORAGE_KEY = "ledger-pwa-state-v1";

const expenseCategories = [
  { name: "餐饮", mark: "餐" },
  { name: "购物", mark: "购" },
  { name: "交通", mark: "行" },
  { name: "礼物", mark: "礼" },
  { name: "住房", mark: "住" },
  { name: "娱乐", mark: "乐" },
  { name: "医疗", mark: "医" },
  { name: "其他", mark: "其" }
];

const incomeCategories = [
  { name: "工资", mark: "薪" },
  { name: "奖金", mark: "奖" },
  { name: "兼职", mark: "兼" },
  { name: "红包", mark: "红" },
  { name: "退款", mark: "退" },
  { name: "其他", mark: "其" }
];

const defaultState = {
  settings: {
    monthlyBudget: "",
    assets: {
      cash: "",
      saving: "",
      debt: ""
    }
  },
  entriesByDate: {}
};

let state = loadState();
let currentDate = todayKey();
let currentMonth = currentDate.slice(0, 7);
let selectedType = "expense";
let selectedCategory = "餐饮";
let chartType = "expense";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  backupButton: $("#backupButton"),
  monthPicker: $("#monthPicker"),
  summaryYear: $("#summaryYear"),
  summaryMonth: $("#summaryMonth"),
  monthIncome: $("#monthIncome"),
  monthExpense: $("#monthExpense"),
  dateInput: $("#dateInput"),
  emptyState: $("#emptyState"),
  dayGroups: $("#dayGroups"),
  budgetForm: $("#budgetForm"),
  monthlyBudget: $("#monthlyBudget"),
  budgetStatus: $("#budgetStatus"),
  budgetMeterFill: $("#budgetMeterFill"),
  budgetHint: $("#budgetHint"),
  assetForm: $("#assetForm"),
  cashAsset: $("#cashAsset"),
  savingAsset: $("#savingAsset"),
  debtAsset: $("#debtAsset"),
  netWorthText: $("#netWorthText"),
  averageDailyText: $("#averageDailyText"),
  barChart: $("#barChart"),
  categoryRank: $("#categoryRank"),
  categoryTotalText: $("#categoryTotalText"),
  entryForm: $("#entryForm"),
  entryType: $("#entryType"),
  amountInput: $("#amountInput"),
  categoryGrid: $("#categoryGrid"),
  entryDateInput: $("#entryDateInput"),
  accountInput: $("#accountInput"),
  noteInput: $("#noteInput"),
  balanceText: $("#balanceText"),
  entryCountText: $("#entryCountText"),
  resetAll: $("#resetAll"),
  importFile: $("#importFile")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return cloneDefaultState();
    return normalizeState(saved);
  } catch {
    return cloneDefaultState();
  }
}

function normalizeState(saved) {
  return {
    ...cloneDefaultState(),
    ...saved,
    settings: {
      ...defaultState.settings,
      ...(saved.settings || {}),
      assets: {
        ...defaultState.settings.assets,
        ...(saved.settings?.assets || {})
      }
    },
    entriesByDate: saved.entriesByDate || {}
  };
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toMoney(value) {
  return (Number(value) || 0).toFixed(2);
}

function toDisplayAmount(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

function getEntries(dateKey) {
  return state.entriesByDate[dateKey] || [];
}

function getMonthDates(monthKey = currentMonth) {
  return Object.keys(state.entriesByDate)
    .filter((dateKey) => dateKey.startsWith(monthKey))
    .sort((a, b) => b.localeCompare(a));
}

function getMonthEntries(monthKey = currentMonth) {
  return getMonthDates(monthKey).flatMap((dateKey) =>
    getEntries(dateKey).map((entry) => ({ ...entry, date: dateKey }))
  );
}

function getMonthTotals(monthKey = currentMonth) {
  return getMonthEntries(monthKey).reduce(
    (totals, entry) => {
      totals[entry.type] += Number(entry.amount) || 0;
      totals.count += 1;
      return totals;
    },
    { income: 0, expense: 0, count: 0 }
  );
}

function getDayTotals(dateKey) {
  return getEntries(dateKey).reduce(
    (totals, entry) => {
      totals[entry.type] += Number(entry.amount) || 0;
      return totals;
    },
    { income: 0, expense: 0 }
  );
}

function getCategory(type, name) {
  return [...expenseCategories, ...incomeCategories].find((category) => category.name === name)
    || (type === "income" ? incomeCategories[0] : expenseCategories[0]);
}

function getMonthDayCount(monthKey = currentMonth) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function formatDayLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return `${String(month).padStart(2, "0")}月${String(day).padStart(2, "0")}日  ${weekdays[date.getDay()]}`;
}

function switchTab(tabName) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `${tabName}View`));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.tabTarget === tabName));
  $$(".quick-action").forEach((item) => item.classList.toggle("active", item.dataset.tabTarget === tabName));
  if (tabName === "add") {
    elements.entryDateInput.value = currentDate;
    elements.amountInput.focus();
  }
}

function renderHero() {
  const totals = getMonthTotals();
  const [year, month] = currentMonth.split("-");
  elements.summaryYear.textContent = `${year}年`;
  elements.summaryMonth.textContent = month;
  elements.monthIncome.textContent = toMoney(totals.income);
  elements.monthExpense.textContent = toMoney(totals.expense);
  elements.balanceText.textContent = toMoney(totals.income - totals.expense);
  elements.entryCountText.textContent = totals.count;
}

function renderEntries() {
  const dates = getMonthDates();
  elements.dayGroups.replaceChildren();
  elements.emptyState.classList.toggle("active", dates.length === 0);

  dates.forEach((dateKey) => {
    const group = $("#dayGroupTemplate").content.firstElementChild.cloneNode(true);
    const totals = getDayTotals(dateKey);
    const list = group.querySelector("ul");
    group.querySelector(".day-label").textContent = formatDayLabel(dateKey);
    group.querySelector(".day-total").textContent = `支出：${toDisplayAmount(totals.expense)}`;

    getEntries(dateKey)
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .forEach((entry) => {
        const item = $("#entryTemplate").content.firstElementChild.cloneNode(true);
        const category = getCategory(entry.type, entry.category);
        const signedAmount = entry.type === "income" ? toDisplayAmount(entry.amount) : `-${toDisplayAmount(entry.amount)}`;
        item.querySelector(".category-badge").textContent = category.mark;
        item.querySelector(".entry-main strong").textContent = entry.category;
        item.querySelector(".entry-main small").textContent = [entry.note, entry.account].filter(Boolean).join(" · ") || entry.account;
        item.querySelector(".entry-amount").textContent = signedAmount;
        item.querySelector(".entry-amount").classList.toggle("income", entry.type === "income");
        item.querySelector(".delete-button").addEventListener("click", () => removeEntry(dateKey, entry.id));
        list.append(item);
      });

    elements.dayGroups.append(group);
  });
}

function renderBudget() {
  const totals = getMonthTotals();
  const budget = Number(state.settings.monthlyBudget) || 0;
  const left = budget - totals.expense;
  const percent = budget > 0 ? Math.min((totals.expense / budget) * 100, 100) : 0;

  elements.monthlyBudget.value = state.settings.monthlyBudget || "";
  elements.budgetStatus.textContent = budget > 0 ? `本月还可用 ${toMoney(left)}` : "还没有设置预算";
  elements.budgetMeterFill.style.width = `${percent}%`;
  elements.budgetHint.textContent = budget > 0
    ? `已用 ${Math.round(percent)}%，本月支出 ${toMoney(totals.expense)}。`
    : "设置一个月支出预算，明细页会继续保持干净。";
}

function renderAssets() {
  const cash = Number(state.settings.assets.cash) || 0;
  const saving = Number(state.settings.assets.saving) || 0;
  const debt = Number(state.settings.assets.debt) || 0;

  elements.cashAsset.value = state.settings.assets.cash || "";
  elements.savingAsset.value = state.settings.assets.saving || "";
  elements.debtAsset.value = state.settings.assets.debt || "";
  elements.netWorthText.textContent = `净资产 ${toMoney(cash + saving - debt)}`;
}

function renderCategoryGrid() {
  const categories = selectedType === "income" ? incomeCategories : expenseCategories;
  if (!categories.some((category) => category.name === selectedCategory)) {
    selectedCategory = categories[0].name;
  }

  elements.categoryGrid.replaceChildren();
  categories.forEach((category) => {
    const button = document.createElement("button");
    const mark = document.createElement("span");
    const label = document.createElement("b");
    button.className = "category-button";
    button.type = "button";
    button.classList.toggle("active", category.name === selectedCategory);
    mark.textContent = category.mark;
    label.textContent = category.name;
    button.append(mark, label);
    button.addEventListener("click", () => {
      selectedCategory = category.name;
      renderCategoryGrid();
    });
    elements.categoryGrid.append(button);
  });

  $$(".type-switch button").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === selectedType);
  });
  elements.entryType.value = selectedType;
}

function renderCharts() {
  const entries = getMonthEntries().filter((entry) => entry.type === chartType);
  const total = entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const dayCount = getMonthDayCount();
  const dayValues = Array.from({ length: dayCount }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const dateKey = `${currentMonth}-${day}`;
    return getEntries(dateKey)
      .filter((entry) => entry.type === chartType)
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  });
  const maxValue = Math.max(...dayValues, 1);
  const visibleIndexes = getVisibleChartIndexes(dayCount);

  elements.averageDailyText.textContent = `日均${chartType === "income" ? "收入" : "支出"} ${toMoney(total / dayCount)}`;
  elements.categoryTotalText.textContent = `合计 ${toMoney(total)}`;
  elements.barChart.replaceChildren();

  visibleIndexes.forEach((dayIndex) => {
    const wrap = document.createElement("div");
    const bar = document.createElement("div");
    const value = document.createElement("strong");
    const label = document.createElement("span");
    const amount = dayValues[dayIndex];
    wrap.className = "bar-wrap";
    bar.className = `bar ${chartType === "income" ? "income" : ""}`;
    bar.style.height = `${Math.max((amount / maxValue) * 132, 6)}px`;
    value.textContent = amount ? toDisplayAmount(amount) : "0";
    label.textContent = `${dayIndex + 1}日`;
    wrap.append(bar, value, label);
    elements.barChart.append(wrap);
  });

  renderCategoryRank(entries, total);
  $$(".chart-tab").forEach((button) => button.classList.toggle("active", button.dataset.chart === chartType));
}

function getVisibleChartIndexes(dayCount) {
  if (dayCount <= 7) return Array.from({ length: dayCount }, (_, index) => index);
  const today = todayKey();
  const isThisMonth = today.startsWith(currentMonth);
  const end = isThisMonth ? Number(today.slice(8, 10)) - 1 : dayCount - 1;
  const start = Math.max(end - 6, 0);
  return Array.from({ length: Math.min(7, dayCount - start) }, (_, index) => start + index);
}

function renderCategoryRank(entries, total) {
  const grouped = entries.reduce((map, entry) => {
    map.set(entry.category, (map.get(entry.category) || 0) + (Number(entry.amount) || 0));
    return map;
  }, new Map());
  const rows = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]);
  elements.categoryRank.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "muted-copy";
    empty.textContent = "暂无分类数据。";
    elements.categoryRank.append(empty);
    return;
  }

  rows.forEach(([name, amount]) => {
    const item = document.createElement("div");
    const mark = document.createElement("span");
    const main = document.createElement("div");
    const title = document.createElement("span");
    const line = document.createElement("div");
    const fill = document.createElement("b");
    const money = document.createElement("strong");
    const category = getCategory(chartType, name);

    item.className = "rank-item";
    mark.className = "rank-mark";
    main.className = "rank-main";
    line.className = "rank-line";
    money.className = "rank-amount";

    mark.textContent = category.mark;
    title.textContent = name;
    fill.style.width = `${total > 0 ? (amount / total) * 100 : 0}%`;
    money.textContent = toDisplayAmount(amount);

    line.append(fill);
    main.append(title, line);
    item.append(mark, main, money);
    elements.categoryRank.append(item);
  });
}

function render() {
  elements.dateInput.value = currentDate;
  elements.entryDateInput.value = currentDate;
  renderHero();
  renderEntries();
  renderBudget();
  renderAssets();
  renderCategoryGrid();
  renderCharts();
}

function addEntry() {
  const amount = Number(elements.amountInput.value);
  const dateKey = elements.entryDateInput.value || currentDate;
  if (!amount || amount <= 0) return;

  const entry = {
    id: createId(),
    type: selectedType,
    category: selectedCategory,
    amount,
    account: elements.accountInput.value,
    note: elements.noteInput.value.trim(),
    createdAt: new Date().toISOString()
  };

  state.entriesByDate[dateKey] = [...getEntries(dateKey), entry];
  currentDate = dateKey;
  currentMonth = dateKey.slice(0, 7);
  saveState();
  elements.entryForm.reset();
  elements.entryDateInput.value = currentDate;
  elements.accountInput.value = entry.account;
  selectedType = "expense";
  selectedCategory = "餐饮";
  render();
  switchTab("detail");
}

function removeEntry(dateKey, id) {
  state.entriesByDate[dateKey] = getEntries(dateKey).filter((entry) => entry.id !== id);
  if (!state.entriesByDate[dateKey].length) delete state.entriesByDate[dateKey];
  saveState();
  render();
}

function downloadBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "xiaosha-ledger",
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ledger-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(reader.result);
      const importedState = payload.state || payload;
      if (!importedState.entriesByDate) throw new Error("Invalid backup");
      state = normalizeState(importedState);
      saveState();
      render();
      switchTab("detail");
    } catch {
      alert("备份文件无法识别");
    }
  });
  reader.readAsText(file);
}

function setType(type) {
  selectedType = type;
  selectedCategory = type === "income" ? incomeCategories[0].name : expenseCategories[0].name;
  renderCategoryGrid();
}

function setCategoryFromName(name) {
  if (incomeCategories.some((category) => category.name === name)) {
    selectedType = "income";
  } else {
    selectedType = "expense";
  }
  selectedCategory = name;
  renderCategoryGrid();
}

$$("[data-tab-target]").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tabTarget));
});

$$(".type-switch button").forEach((button) => {
  button.addEventListener("click", () => setType(button.dataset.type));
});

$$(".chart-tab").forEach((button) => {
  button.addEventListener("click", () => {
    chartType = button.dataset.chart;
    renderCharts();
  });
});

$$("[data-fill-category]").forEach((button) => {
  button.addEventListener("click", () => {
    setCategoryFromName(button.dataset.fillCategory);
    switchTab("add");
  });
});

elements.monthPicker.addEventListener("click", () => {
  const nextMonth = prompt("输入月份，例如 2026-06", currentMonth);
  if (!nextMonth) return;
  if (!/^\d{4}-\d{2}$/.test(nextMonth)) {
    alert("月份格式应为 YYYY-MM");
    return;
  }
  currentMonth = nextMonth;
  currentDate = `${nextMonth}-01`;
  render();
});

elements.dateInput.addEventListener("change", (event) => {
  currentDate = event.target.value || todayKey();
  currentMonth = currentDate.slice(0, 7);
  render();
});

elements.entryDateInput.addEventListener("change", (event) => {
  if (!event.target.value) event.target.value = currentDate;
});

elements.entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEntry();
});

elements.budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings.monthlyBudget = elements.monthlyBudget.value;
  saveState();
  renderBudget();
});

elements.assetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings.assets = {
    cash: elements.cashAsset.value,
    saving: elements.savingAsset.value,
    debt: elements.debtAsset.value
  };
  saveState();
  renderAssets();
});

elements.backupButton.addEventListener("click", downloadBackup);

elements.resetAll.addEventListener("click", () => {
  if (!confirm("重置全部资产、预算和明细？")) return;
  state = cloneDefaultState();
  currentDate = todayKey();
  currentMonth = currentDate.slice(0, 7);
  saveState();
  render();
  switchTab("detail");
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
