import {
  Expense,
  CategoryKey,
  CATEGORIES,
  FilterState,
  EMPTY_FILTER,
  generateId,
  getCategoryMeta,
  CURRENCY_SYMBOLS,
} from "./types";
import {
  saveExpense,
  deleteExpense,
  getAllExpenses,
  getExpense,
  clearAllData,
  getCurrency,
  setCurrency,
  getCurrencySymbol,
} from "./storage";
import { categorize } from "./categorizer";
import { captureFromCamera, uploadReceipt, removeReceipt } from "./camera";
import { renderBarChart, renderSummaryCards } from "./charts";
import { exportToCSV } from "./export";

type TabId = "dashboard" | "add" | "history" | "settings";

const PAGE_SIZE = 20;

let currentTab: TabId = "dashboard";
let allExpenses: Expense[] = [];
let editingId: string | null = null;
let currentReceiptUrl = "";
let historyPage = 0;
let activeFilter: FilterState = { ...EMPTY_FILTER };
let filteredExpenses: Expense[] = [];

function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(amount: number): string {
  return `${getCurrencySymbol()}${amount.toFixed(2)}`;
}

function formatDateDisplay(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Tab Navigation ──────────────────────────────────────────────

function switchTab(tab: TabId): void {
  currentTab = tab;

  document.querySelectorAll(".tab-content").forEach((el) => {
    el.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((el) => {
    el.classList.remove("active");
  });

  $(`tab-${tab}`).classList.add("active");
  const btn = document.querySelector(`[data-tab="${tab}"]`);
  if (btn) btn.classList.add("active");

  if (tab === "dashboard") refreshDashboard();
  if (tab === "history") refreshHistory();
}

function setupTabs(): void {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = (btn as HTMLElement).dataset.tab as TabId;
      if (tab) switchTab(tab);
    });
  });
}

// ── Dashboard ───────────────────────────────────────────────────

function refreshDashboard(): void {
  const now = new Date();
  const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getFullYear() + "-" + String(lastMonthDate.getMonth() + 1).padStart(2, "0");

  const thisMonthExpenses = allExpenses.filter((e) => e.date.startsWith(thisMonth));
  const lastMonthExpenses = allExpenses.filter((e) => e.date.startsWith(lastMonth));

  renderSummaryCards($("summary-cards"), thisMonthExpenses, lastMonthExpenses);

  const chartContainer = $("category-chart");
  if (chartContainer) {
    renderBarChart(chartContainer, thisMonthExpenses);
  }

  const recentList = $("recent-expenses");
  if (recentList) {
    const recent = allExpenses.slice(0, 10);
    if (recent.length === 0) {
      recentList.innerHTML = '<div class="empty-state">No expenses yet. Tap + to add one!</div>';
    } else {
      recentList.innerHTML = recent.map((e) => renderExpenseRow(e)).join("");
    }
  }
}

function renderExpenseRow(expense: Expense): string {
  const meta = getCategoryMeta(expense.category);
  return `
    <div class="expense-row" data-id="${expense.id}">
      <div class="expense-icon" style="background:${meta.color}15;color:${meta.color}">${meta.icon}</div>
      <div class="expense-info">
        <div class="expense-desc">${escapeHtml(expense.description)}</div>
        <div class="expense-meta">${meta.label} · ${formatDateDisplay(expense.date)}</div>
      </div>
      <div class="expense-amount">${formatCurrency(expense.amount)}</div>
      <button class="expense-delete" data-id="${expense.id}" aria-label="Delete expense">✕</button>
    </div>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ── Add/Edit Expense ────────────────────────────────────────────

function setupAddForm(): void {
  const form = $("expense-form");
  const descInput = $("exp-description") as HTMLInputElement;
  const catSelect = $("exp-category") as HTMLSelectElement;
  const dateInput = $("exp-date") as HTMLInputElement;
  const amountInput = $("exp-amount") as HTMLInputElement;

  dateInput.value = todayISO();

  // Auto-categorize on description change
  descInput.addEventListener("input", () => {
    if (!editingId && descInput.value.trim().length > 2) {
      const guessed = categorize(descInput.value);
      catSelect.value = guessed;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleSaveExpense();
  });

  $("btn-camera")?.addEventListener("click", async () => {
    try {
      const dataUrl = await captureFromCamera();
      currentReceiptUrl = dataUrl;
      showReceiptPreview(dataUrl);
    } catch {
      // user cancelled
    }
  });

  $("btn-upload")?.addEventListener("click", async () => {
    try {
      const dataUrl = await uploadReceipt();
      currentReceiptUrl = dataUrl;
      showReceiptPreview(dataUrl);
    } catch {
      // user cancelled
    }
  });

  $("btn-remove-receipt")?.addEventListener("click", () => {
    currentReceiptUrl = removeReceipt();
    hideReceiptPreview();
  });
}

function showReceiptPreview(dataUrl: string): void {
  const preview = $("receipt-preview");
  const img = preview?.querySelector("img");
  if (img) img.src = dataUrl;
  preview?.classList.add("has-image");
  $("btn-remove-receipt")?.classList.remove("hidden");
}

function hideReceiptPreview(): void {
  const preview = $("receipt-preview");
  const img = preview?.querySelector("img");
  if (img) img.src = "";
  preview?.classList.remove("has-image");
  $("btn-remove-receipt")?.classList.add("hidden");
}

async function handleSaveExpense(): Promise<void> {
  const amount = parseFloat(($("exp-amount") as HTMLInputElement).value);
  const date = ($("exp-date") as HTMLInputElement).value;
  const category = ($("exp-category") as HTMLSelectElement).value as CategoryKey;
  const description = ($("exp-description") as HTMLInputElement).value.trim();
  const notes = ($("exp-notes") as HTMLTextAreaElement).value.trim();

  if (!amount || amount <= 0 || !date || !description) {
    showToast("Please fill in amount, date, and description");
    return;
  }

  const expense: Expense = editingId
    ? {
        ...(await getExpense(editingId)) ?? createBlankExpense(editingId),
        amount,
        date,
        category,
        description,
        notes,
        receiptUrl: currentReceiptUrl,
      }
    : {
        id: generateId(),
        amount,
        date,
        category,
        description,
        notes,
        receiptUrl: currentReceiptUrl,
        createdAt: new Date().toISOString(),
      };

  await saveExpense(expense);
  await loadData();

  resetForm();
  editingId = null;
  showToast(editingId ? "Expense updated" : "Expense saved");
  switchTab("dashboard");
}

function createBlankExpense(id: string): Expense {
  return {
    id,
    amount: 0,
    date: todayISO(),
    category: "other",
    description: "",
    notes: "",
    receiptUrl: "",
    createdAt: new Date().toISOString(),
  };
}

function resetForm(): void {
  ($("exp-amount") as HTMLInputElement).value = "";
  ($("exp-date") as HTMLInputElement).value = todayISO();
  ($("exp-category") as HTMLSelectElement).value = "food";
  ($("exp-description") as HTMLInputElement).value = "";
  ($("exp-notes") as HTMLTextAreaElement).value = "";
  currentReceiptUrl = "";
  hideReceiptPreview();
  $("form-title")!.textContent = "New Expense";
  $("btn-save-text")!.textContent = "Save Expense";
  $("btn-cancel-edit")?.classList.add("hidden");
}

async function editExpense(id: string): Promise<void> {
  const expense = await getExpense(id);
  if (!expense) return;

  editingId = id;
  ($("exp-amount") as HTMLInputElement).value = expense.amount.toString();
  ($("exp-date") as HTMLInputElement).value = expense.date;
  ($("exp-category") as HTMLSelectElement).value = expense.category;
  ($("exp-description") as HTMLInputElement).value = expense.description;
  ($("exp-notes") as HTMLTextAreaElement).value = expense.notes;

  if (expense.receiptUrl) {
    currentReceiptUrl = expense.receiptUrl;
    showReceiptPreview(expense.receiptUrl);
  }

  $("form-title")!.textContent = "Edit Expense";
  $("btn-save-text")!.textContent = "Update Expense";
  $("btn-cancel-edit")?.classList.remove("hidden");

  switchTab("add");
}

// ── History ─────────────────────────────────────────────────────

function setupHistory(): void {
  historyPage = 0;

  $("btn-filter-toggle")?.addEventListener("click", () => {
    $("filter-panel")?.classList.toggle("open");
  });

  $("btn-apply-filter")?.addEventListener("click", () => {
    activeFilter = {
      dateFrom: ($("filter-date-from") as HTMLInputElement).value,
      dateTo: ($("filter-date-to") as HTMLInputElement).value,
      category: ($("filter-category") as HTMLSelectElement).value as CategoryKey | "",
      amountMin: ($("filter-amount-min") as HTMLInputElement).value,
      amountMax: ($("filter-amount-max") as HTMLInputElement).value,
    };
    historyPage = 0;
    applyFiltersAndRender();
  });

  $("btn-clear-filter")?.addEventListener("click", () => {
    activeFilter = { ...EMPTY_FILTER };
    ($("filter-date-from") as HTMLInputElement).value = "";
    ($("filter-date-to") as HTMLInputElement).value = "";
    ($("filter-category") as HTMLSelectElement).value = "";
    ($("filter-amount-min") as HTMLInputElement).value = "";
    ($("filter-amount-max") as HTMLInputElement).value = "";
    historyPage = 0;
    applyFiltersAndRender();
  });

  $("btn-load-more")?.addEventListener("click", () => {
    historyPage++;
    renderHistoryPage(false);
  });

  $("expense-list")?.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains("expense-delete")) {
      const id = target.dataset.id;
      if (id && confirm("Delete this expense?")) {
        await deleteExpense(id);
        await loadData();
        refreshHistory();
        showToast("Expense deleted");
      }
      return;
    }

    const row = target.closest(".expense-row") as HTMLElement;
    if (row?.dataset.id) {
      await editExpense(row.dataset.id);
    }
  });
}

function refreshHistory(): void {
  historyPage = 0;
  applyFiltersAndRender();
}

function applyFiltersAndRender(): void {
  filteredExpenses = allExpenses.filter((e) => {
    if (activeFilter.dateFrom && e.date < activeFilter.dateFrom) return false;
    if (activeFilter.dateTo && e.date > activeFilter.dateTo) return false;
    if (activeFilter.category && e.category !== activeFilter.category) return false;
    if (activeFilter.amountMin && e.amount < parseFloat(activeFilter.amountMin)) return false;
    if (activeFilter.amountMax && e.amount > parseFloat(activeFilter.amountMax)) return false;
    return true;
  });

  renderHistoryPage(true);
}

function renderHistoryPage(reset: boolean): void {
  const list = $("expense-list");
  if (!list) return;

  if (reset) list.innerHTML = "";

  const start = historyPage * PAGE_SIZE;
  const page = filteredExpenses.slice(start, start + PAGE_SIZE);

  if (filteredExpenses.length === 0) {
    list.innerHTML = '<div class="empty-state">No expenses found</div>';
    $("btn-load-more")?.classList.add("hidden");
    $("history-count")!.textContent = "0 expenses";
    return;
  }

  list.insertAdjacentHTML("beforeend", page.map(renderExpenseRow).join(""));

  const totalShown = Math.min(start + PAGE_SIZE, filteredExpenses.length);
  $("history-count")!.textContent = `${filteredExpenses.length} expenses`;

  if (totalShown >= filteredExpenses.length) {
    $("btn-load-more")?.classList.add("hidden");
  } else {
    $("btn-load-more")?.classList.remove("hidden");
  }
}

// ── Settings ────────────────────────────────────────────────────

function setupSettings(): void {
  const currencySelect = $("settings-currency") as HTMLSelectElement;
  currencySelect.value = getCurrency();

  currencySelect.addEventListener("change", () => {
    setCurrency(currencySelect.value);
    showToast(`Currency set to ${currencySelect.value}`);
  });

  $("btn-export")?.addEventListener("click", () => {
    exportToCSV(allExpenses);
    showToast("CSV downloaded");
  });

  $("btn-clear-data")?.addEventListener("click", async () => {
    if (confirm("Delete ALL expenses? This cannot be undone.")) {
      await clearAllData();
      await loadData();
      refreshDashboard();
      refreshHistory();
      showToast("All data cleared");
    }
  });

  $("btn-cancel-edit")?.addEventListener("click", () => {
    editingId = null;
    resetForm();
    switchTab("add");
  });
}

// ── Toast ───────────────────────────────────────────────────────

function showToast(message: string): void {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ── Install Banner ──────────────────────────────────────────────

function setupInstallPrompt(): void {
  let deferredPrompt: { prompt: () => void } | null = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as unknown as { prompt: () => void };

    const banner = $("install-banner");
    if (banner) banner.classList.remove("hidden");

    $("btn-install")?.addEventListener("click", () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
      }
      banner?.classList.add("hidden");
    });

    $("btn-install-dismiss")?.addEventListener("click", () => {
      banner?.classList.add("hidden");
    });
  });
}

// ── Data Loading ────────────────────────────────────────────────

async function loadData(): Promise<void> {
  allExpenses = await getAllExpenses();
}

// ── Boot ────────────────────────────────────────────────────────

async function init(): Promise<void> {
  setupTabs();
  setupAddForm();
  setupHistory();
  setupSettings();
  setupInstallPrompt();

  await loadData();
  refreshDashboard();

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch {
      // SW registration failed — app still works without it
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
