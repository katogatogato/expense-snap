import { Expense } from "./types";
import { getCurrencySymbol } from "./storage";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function exportToCSV(expenses: Expense[]): void {
  if (expenses.length === 0) return;

  const symbol = getCurrencySymbol();
  const headers = [
    "Date",
    "Amount",
    "Currency",
    "Category",
    "Description",
    "Notes",
  ];

  const rows = expenses.map((e) =>
    [
      formatDate(e.date),
      e.amount.toFixed(2),
      symbol,
      e.category,
      escapeCSV(e.description),
      escapeCSV(e.notes),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10);
  link.download = `expense-snap-${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
