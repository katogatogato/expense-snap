import { Expense, CATEGORIES, getCategoryMeta, CategoryKey } from "./types";

interface CategoryTotal {
  key: CategoryKey;
  label: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}

export function computeCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  if (expenses.length === 0) return [];

  const totals = new Map<CategoryKey, number>();
  let grandTotal = 0;

  for (const expense of expenses) {
    const current = totals.get(expense.category) ?? 0;
    totals.set(expense.category, current + expense.amount);
    grandTotal += expense.amount;
  }

  const results: CategoryTotal[] = [];
  for (const [key, total] of totals) {
    const meta = getCategoryMeta(key);
    results.push({
      key,
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    });
  }

  results.sort((a, b) => b.total - a.total);
  return results;
}

export function renderBarChart(container: HTMLElement, expenses: Expense[]): void {
  const totals = computeCategoryTotals(expenses);
  container.innerHTML = "";

  if (totals.length === 0) {
    container.innerHTML =
      '<div class="chart-empty">No expenses to chart</div>';
    return;
  }

  const maxPercentage = Math.max(...totals.map((t) => t.percentage));

  const chart = document.createElement("div");
  chart.className = "bar-chart";

  for (const item of totals) {
    const barWidth =
      maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0;

    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("div");
    label.className = "bar-label";
    label.innerHTML = `<span class="bar-icon">${item.icon}</span> ${item.label}`;

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${barWidth}%`;
    fill.style.backgroundColor = item.color;
    fill.style.transition = "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)";

    const value = document.createElement("div");
    value.className = "bar-value";
    value.textContent = `${item.percentage.toFixed(0)}%`;

    track.appendChild(fill);
    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    chart.appendChild(row);
  }

  container.appendChild(chart);
}

export function renderSummaryCards(
  container: HTMLElement,
  thisMonth: Expense[],
  lastMonth: Expense[]
): void {
  const thisTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);
  const lastTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);
  const diff = thisTotal - lastTotal;
  const diffPercent =
    lastTotal > 0 ? ((diff / lastTotal) * 100).toFixed(0) : "—";

  const diffLabel =
    lastTotal === 0
      ? ""
      : diff > 0
        ? `↑ ${diffPercent}% vs last month`
        : diff < 0
          ? `↓ ${Math.abs(Number(diffPercent))}% vs last month`
          : "= same as last month";

  const diffClass =
    diff > 0 ? "diff-up" : diff < 0 ? "diff-down" : "diff-same";

  container.innerHTML = `
    <div class="summary-card primary">
      <div class="summary-label">This Month</div>
      <div class="summary-amount" id="summary-this-month">$${thisTotal.toFixed(2)}</div>
      <div class="summary-diff ${diffClass}">${diffLabel}</div>
    </div>
    <div class="summary-card secondary">
      <div class="summary-label">Last Month</div>
      <div class="summary-amount" id="summary-last-month">$${lastTotal.toFixed(2)}</div>
    </div>
    <div class="summary-card accent">
      <div class="summary-label">Transactions</div>
      <div class="summary-amount" id="summary-count">${thisMonth.length}</div>
    </div>
  `;
}
