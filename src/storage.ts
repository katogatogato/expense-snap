import { Expense, CategoryKey, CATEGORIES, DEFAULT_CURRENCY } from "./types";

const DB_NAME = "expense-snap-db";
const DB_VERSION = 1;
const EXPENSE_STORE = "expenses";
const SETTINGS_KEY = "expense-snap-settings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EXPENSE_STORE)) {
        const store = db.createObjectStore(EXPENSE_STORE, { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveExpense(expense: Expense): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXPENSE_STORE, "readwrite");
    tx.objectStore(EXPENSE_STORE).put(expense);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXPENSE_STORE, "readwrite");
    tx.objectStore(EXPENSE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getExpense(id: string): Promise<Expense | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXPENSE_STORE, "readonly");
    const request = tx.objectStore(EXPENSE_STORE).get(id);
    request.onsuccess = () => resolve(request.result ?? undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllExpenses(): Promise<Expense[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXPENSE_STORE, "readonly");
    const request = tx.objectStore(EXPENSE_STORE).getAll();
    request.onsuccess = () => {
      const expenses: Expense[] = request.result ?? [];
      expenses.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      resolve(expenses);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXPENSE_STORE, "readwrite");
    tx.objectStore(EXPENSE_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface AppSettings {
  currency: string;
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currency: parsed.currency ?? DEFAULT_CURRENCY,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { currency: DEFAULT_CURRENCY };
}

function persistSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getCurrency(): string {
  return loadSettings().currency;
}

export function setCurrency(code: string): void {
  const settings = loadSettings();
  settings.currency = code;
  persistSettings(settings);
}

export function getCurrencySymbol(): string {
  const code = getCurrency();
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    INR: "₹",
    BRL: "R$",
    MXN: "MX$",
    CHF: "CHF",
  };
  return symbols[code] ?? code;
}

export function getCategoryKeys(): CategoryKey[] {
  return CATEGORIES.map((c) => c.key);
}
