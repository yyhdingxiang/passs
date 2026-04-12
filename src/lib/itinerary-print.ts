import { escapeHtml } from "@/lib/html";
import { renderItineraryHtml } from "@/lib/itinerary-html";
import type { ItineraryDocument } from "@/lib/itinerary-document";

export type PdfExportPhase =
  | "idle"
  | "building"
  | "rendering"
  | "printing"
  | "waiting"
  | "done"
  | "cancelled"
  | "error";

export type PdfExportStatus = {
  phase: PdfExportPhase;
  progress: 0 | 25 | 50 | 75 | 100;
  message: string;
};

export const idlePdfExportStatus: PdfExportStatus = {
  phase: "idle",
  progress: 0,
  message: ""
};

const pdfStatusMap: Record<Exclude<PdfExportPhase, "idle">, PdfExportStatus> = {
  building: { phase: "building", progress: 25, message: "正在准备 PDF 内容..." },
  rendering: { phase: "rendering", progress: 50, message: "正在生成打印页..." },
  printing: { phase: "printing", progress: 75, message: "正在打开打印对话框..." },
  waiting: { phase: "waiting", progress: 75, message: "请在系统打印窗口中保存为 PDF" },
  done: { phase: "done", progress: 100, message: "PDF 导出流程已结束" },
  cancelled: { phase: "cancelled", progress: 100, message: "PDF 导出已取消" },
  error: { phase: "error", progress: 100, message: "PDF 导出失败，请检查浏览器弹窗权限后重试" }
};

export function advancePdfExportState(phase: Exclude<PdfExportPhase, "idle">) {
  return pdfStatusMap[phase];
}

export function renderItineraryPrintHtml(documentModel: ItineraryDocument) {
  return `<!doctype html>
<html lang="${documentModel.locale}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(documentModel.title)}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        color: #111827;
      }
      div, table, thead, tbody, tr, th, td {
        font-size: 12px;
        line-height: 1.6;
      }
      strong {
        display: inline-block;
        margin-bottom: 8px;
        font-size: 18px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 8px;
        vertical-align: top;
        text-align: left;
        word-break: break-word;
      }
      thead {
        display: table-header-group;
      }
      tr {
        page-break-inside: avoid;
      }
    </style>
  </head>
  <body>${renderItineraryHtml(documentModel)}</body>
</html>`;
}

export function openItineraryPrintWindow(documentModel: ItineraryDocument) {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    throw new Error("PRINT_WINDOW_BLOCKED");
  }

  printWindow.document.open();
  printWindow.document.write(renderItineraryPrintHtml(documentModel));
  printWindow.document.close();

  return printWindow;
}
