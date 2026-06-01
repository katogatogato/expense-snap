export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: CategoryKey;
  description: string;
  notes: string;
  receiptUrl: string;
  createdAt: string;
}

export type CategoryKey =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "bills"
  | "health"
  | "education"
  | "other";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "food", label: "Food", icon: "🍔", color: "#E8590C" },
  { key: "transport", label: "Transport", icon: "🚗", color: "#1971C2" },
  { key: "shopping", label: "Shopping", icon: "🛍️", color: "#9C36B5" },
  { key: "entertainment", label: "Entertainment", icon: "🎬", color: "#E64980" },
  { key: "bills", label: "Bills", icon: "📄", color: "#2B8A3E" },
  { key: "health", label: "Health", icon: "💊", color: "#0C8599" },
  { key: "education", label: "Education", icon: "📚", color: "#6741D9" },
  { key: "other", label: "Other", icon: "📌", color: "#868E96" },
];

export const CATEGORY_MAP = new Map<CategoryKey, CategoryMeta>(
  CATEGORIES.map((c) => [c.key, c])
);

export const DEFAULT_CURRENCY = "USD";

export const CURRENCY_SYMBOLS: Record<string, string> = {
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

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  category: CategoryKey | "";
  amountMin: string;
  amountMax: string;
}

export const EMPTY_FILTER: FilterState = {
  dateFrom: "",
  dateTo: "",
  category: "",
  amountMin: "",
  amountMax: "",
};

export function getCategoryMeta(key: CategoryKey): CategoryMeta {
  return CATEGORY_MAP.get(key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
