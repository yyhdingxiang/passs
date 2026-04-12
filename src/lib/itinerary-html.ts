import { escapeHtml } from "@/lib/html";
import type { ItineraryDocument } from "@/lib/itinerary-document";

export function renderItineraryHtml(document: ItineraryDocument) {
  const separator = document.locale === "zh" ? " ｜ " : " | ";
  const header = document.headerFields
    .map(field => `${escapeHtml(field.label)}：${escapeHtml(field.value)}`)
    .join(separator);

  const tableHead = document.columns
    .map(column => `<th>${escapeHtml(column.label)}</th>`)
    .join("");

  const tableRows = document.rows
    .map(row => `<tr>${document.columns.map(column => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`)
    .join("");

  return `<div><strong>${escapeHtml(document.title)}</strong></div><div>${header}</div><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table>`;
}
