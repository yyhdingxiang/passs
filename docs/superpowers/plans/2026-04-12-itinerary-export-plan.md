# Itinerary Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared-model itinerary export so the generated Chinese and English itinerary can be exported as DOCX and PDF with a staged PDF progress bar.

**Architecture:** Extract the itinerary generation logic from `visa-assistant.tsx` into a shared document builder and separate render/export modules. Keep `GeneratedPreview` as the HTML sink, add a DOCX exporter backed by `docx`, add a print-page PDF exporter with an explicit progress state machine, and keep `visa-assistant.tsx` focused on form state and export orchestration.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, `docx`, `file-saver`, Vitest

---

### Task 1: Add export dependencies and a minimal test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/itinerary-document.test.ts`

- [ ] **Step 1: Add the runtime and test dependencies**

Update `package.json` to add `docx`, `file-saver`, `vitest`, and `@types/file-saver`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "docx": "^9.5.1",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
```

- [ ] **Step 3: Write the first failing test for the future itinerary builder**

Create `src/lib/itinerary-document.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildItineraryDocument } from "@/lib/itinerary-document";

describe("buildItineraryDocument", () => {
  it("builds a Chinese itinerary document with header fields and rows", () => {
    const result = buildItineraryDocument({
      applicantName: "张三",
      passportNo: "E12345678",
      province: "四川省",
      departureCity: "成都市",
      locale: "zh",
      days: [
        {
          date: "2026-04-12",
          route: "罗马",
          attractions: "罗马斗兽场",
          accommodation: "酒店：Roma Hotel；地址：Via Roma；联系方式：123456",
          transportation: "飞机（起飞：成都天府国际机场（TFU）；落地：罗马菲乌米奇诺机场（FCO）；航班号：CA123）"
        }
      ]
    });

    expect(result.locale).toBe("zh");
    expect(result.title).toContain("行程单");
    expect(result.headerFields[0]).toEqual({ label: "申请人", value: "张三" });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.day).toBe("1");
  });
});
```

- [ ] **Step 4: Run the test and verify it fails because the module does not exist yet**

Run:

```bash
pnpm test src/lib/itinerary-document.test.ts
```

Expected:

- Vitest starts successfully
- The test fails with an import or symbol-not-found error for `@/lib/itinerary-document`

- [ ] **Step 5: Commit the harness**

```bash
git add package.json vitest.config.ts src/lib/itinerary-document.test.ts pnpm-lock.yaml
git commit -m "test: add itinerary export test harness"
```

### Task 2: Extract the shared itinerary document builder

**Files:**
- Create: `src/lib/itinerary-document.ts`
- Modify: `src/lib/itinerary-document.test.ts`
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Create shared itinerary document types and the builder input**

Create `src/lib/itinerary-document.ts`:

```ts
export type ItineraryLocale = "zh" | "en";

export type ItineraryDocumentRow = {
  day: string;
  date: string;
  city: string;
  attractions: string;
  accommodation: string;
  transportation: string;
};

export type ItineraryDocument = {
  locale: ItineraryLocale;
  title: string;
  headerFields: Array<{ label: string; value: string }>;
  columns: Array<{ key: keyof ItineraryDocumentRow; label: string }>;
  rows: ItineraryDocumentRow[];
  fileName: string;
};

export type BuildItineraryDocumentInput = {
  applicantName: string;
  passportNo: string;
  province: string;
  departureCity: string;
  locale: ItineraryLocale;
  days: Array<{
    date: string;
    route: string;
    attractions: string;
    accommodation: string;
    transportation: string;
  }>;
};
```

- [ ] **Step 2: Implement the minimal builder to satisfy the first test**

Append to `src/lib/itinerary-document.ts`:

```ts
function buildFileName(locale: ItineraryLocale) {
  const today = new Date().toISOString().slice(0, 10);
  return `schengen-itinerary-${locale}-${today}`;
}

export function buildItineraryDocument(input: BuildItineraryDocumentInput): ItineraryDocument {
  const isZh = input.locale === "zh";

  return {
    locale: input.locale,
    title: isZh ? "意大利申根签证行程单（中文版）" : "ITALY SCHENGEN VISA ITINERARY (ENGLISH)",
    headerFields: isZh
      ? [
          { label: "申请人", value: input.applicantName || "未填写" },
          { label: "护照号", value: input.passportNo || "未填写" },
          { label: "出发地", value: `${input.province}${input.departureCity}` || "未填写" }
        ]
      : [
          { label: "Applicant", value: input.applicantName || "N/A" },
          { label: "Passport No.", value: input.passportNo || "N/A" },
          { label: "Departure", value: input.departureCity || "N/A" }
        ],
    columns: isZh
      ? [
          { key: "day", label: "天数" },
          { key: "date", label: "日期（星期）" },
          { key: "city", label: "城市" },
          { key: "attractions", label: "景点" },
          { key: "accommodation", label: "住宿" },
          { key: "transportation", label: "交通方式" }
        ]
      : [
          { key: "day", label: "Day" },
          { key: "date", label: "Date (Weekday)" },
          { key: "city", label: "City" },
          { key: "attractions", label: "Attractions" },
          { key: "accommodation", label: "Accommodation" },
          { key: "transportation", label: "Transportation" }
        ],
    rows: input.days.map((day, index) => ({
      day: String(index + 1),
      date: day.date,
      city: day.route,
      attractions: day.attractions,
      accommodation: day.accommodation,
      transportation: day.transportation
    })),
    fileName: buildFileName(input.locale)
  };
}
```

- [ ] **Step 3: Expand the test to lock the English branch and file naming**

Append to `src/lib/itinerary-document.test.ts`:

```ts
it("builds an English itinerary document with English columns", () => {
  const result = buildItineraryDocument({
    applicantName: "",
    passportNo: "",
    province: "北京市",
    departureCity: "北京",
    locale: "en",
    days: []
  });

  expect(result.locale).toBe("en");
  expect(result.title).toContain("ENGLISH");
  expect(result.headerFields[0]).toEqual({ label: "Applicant", value: "N/A" });
  expect(result.columns.map(column => column.label)).toEqual([
    "Day",
    "Date (Weekday)",
    "City",
    "Attractions",
    "Accommodation",
    "Transportation"
  ]);
  expect(result.fileName).toMatch(/^schengen-itinerary-en-\d{4}-\d{2}-\d{2}$/);
});
```

- [ ] **Step 4: Run the focused tests and make sure they pass**

Run:

```bash
pnpm test src/lib/itinerary-document.test.ts
```

Expected:

- Both `buildItineraryDocument` tests pass

- [ ] **Step 5: Move the existing itinerary row-building logic in `visa-assistant.tsx` behind the builder input**

Inside `src/components/visa-assistant.tsx`, replace the direct HTML-only output approach with a builder-input assembly like:

```tsx
const zhDocument = buildItineraryDocument({
  applicantName,
  passportNo,
  province,
  departureCity: city,
  locale: "zh",
  days: zhDayRows
});

const enDocument = buildItineraryDocument({
  applicantName,
  passportNo,
  province,
  departureCity: cityToEn(city),
  locale: "en",
  days: enDayRows
});
```

- [ ] **Step 6: Commit the shared model extraction**

```bash
git add src/lib/itinerary-document.ts src/lib/itinerary-document.test.ts src/components/visa-assistant.tsx
git commit -m "refactor: extract itinerary document model"
```

### Task 3: Add an HTML renderer and restore the preview from the shared model

**Files:**
- Create: `src/lib/itinerary-html.ts`
- Create: `src/lib/itinerary-html.test.ts`
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Write the failing renderer test**

Create `src/lib/itinerary-html.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderItineraryHtml } from "@/lib/itinerary-html";
import { buildItineraryDocument } from "@/lib/itinerary-document";

describe("renderItineraryHtml", () => {
  it("renders title, header fields, table head, and rows", () => {
    const document = buildItineraryDocument({
      applicantName: "张三",
      passportNo: "E12345678",
      province: "四川省",
      departureCity: "成都市",
      locale: "zh",
      days: [
        {
          date: "2026-04-12 周日",
          route: "罗马",
          attractions: "罗马斗兽场",
          accommodation: "Roma Hotel",
          transportation: "飞机"
        }
      ]
    });

    const html = renderItineraryHtml(document);

    expect(html).toContain("意大利申根签证行程单（中文版）");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>天数</th>");
    expect(html).toContain("<td>1</td>");
    expect(html).toContain("罗马斗兽场");
  });
});
```

- [ ] **Step 2: Run the renderer test and verify it fails**

Run:

```bash
pnpm test src/lib/itinerary-html.test.ts
```

Expected:

- Vitest fails because `@/lib/itinerary-html` does not exist yet

- [ ] **Step 3: Implement the HTML renderer**

Create `src/lib/itinerary-html.ts`:

```ts
import { escapeHtml } from "@/lib/html";
import type { ItineraryDocument } from "@/lib/itinerary-document";

export function renderItineraryHtml(document: ItineraryDocument) {
  const header = document.headerFields
    .map(field => `${escapeHtml(field.label)}：${escapeHtml(field.value)}`)
    .join(document.locale === "zh" ? " ｜ " : " | ");

  const tableHead = document.columns
    .map(column => `<th>${escapeHtml(column.label)}</th>`)
    .join("");

  const tableRows = document.rows
    .map(row => (
      `<tr>${document.columns
        .map(column => `<td>${escapeHtml(row[column.key])}</td>`)
        .join("")}</tr>`
    ))
    .join("");

  return `<div><strong>${escapeHtml(document.title)}</strong></div><div>${header}</div><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table>`;
}
```

- [ ] **Step 4: Update `visa-assistant.tsx` to render previews from the model**

Replace the final preview assignment with:

```tsx
setZhItinerary(renderItineraryHtml(zhDocument));
setEnItinerary(renderItineraryHtml(enDocument));
setZhItineraryDocument(zhDocument);
setEnItineraryDocument(enDocument);
```

Also add state for the cached documents:

```tsx
const [zhItineraryDocument, setZhItineraryDocument] = useState<ItineraryDocument | null>(null);
const [enItineraryDocument, setEnItineraryDocument] = useState<ItineraryDocument | null>(null);
```

- [ ] **Step 5: Run the document and renderer tests**

Run:

```bash
pnpm test src/lib/itinerary-document.test.ts src/lib/itinerary-html.test.ts
```

Expected:

- All tests pass

- [ ] **Step 6: Commit the preview refactor**

```bash
git add src/lib/itinerary-html.ts src/lib/itinerary-html.test.ts src/components/visa-assistant.tsx
git commit -m "refactor: render itinerary preview from shared model"
```

### Task 4: Implement DOCX export and the PDF progress state machine

**Files:**
- Create: `src/lib/itinerary-docx.ts`
- Create: `src/lib/itinerary-print.ts`
- Create: `src/lib/itinerary-print.test.ts`

- [ ] **Step 1: Write the failing tests for the print-state machine and print HTML**

Create `src/lib/itinerary-print.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { advancePdfExportState, renderItineraryPrintHtml } from "@/lib/itinerary-print";
import { buildItineraryDocument } from "@/lib/itinerary-document";

describe("advancePdfExportState", () => {
  it("moves from building to rendering to printing with staged progress", () => {
    expect(advancePdfExportState("idle", "building")).toEqual({ phase: "building", progress: 25, message: "正在准备 PDF 内容..." });
    expect(advancePdfExportState("building", "rendering")).toEqual({ phase: "rendering", progress: 50, message: "正在生成打印页..." });
    expect(advancePdfExportState("rendering", "printing")).toEqual({ phase: "printing", progress: 75, message: "正在打开打印对话框..." });
  });
});

describe("renderItineraryPrintHtml", () => {
  it("renders an A4-ready print page", () => {
    const document = buildItineraryDocument({
      applicantName: "张三",
      passportNo: "E12345678",
      province: "四川省",
      departureCity: "成都市",
      locale: "zh",
      days: []
    });

    const html = renderItineraryPrintHtml(document);

    expect(html).toContain("@page");
    expect(html).toContain("A4");
    expect(html).toContain("意大利申根签证行程单（中文版）");
  });
});
```

- [ ] **Step 2: Run the print tests and verify they fail**

Run:

```bash
pnpm test src/lib/itinerary-print.test.ts
```

Expected:

- Vitest fails because `@/lib/itinerary-print` does not exist yet

- [ ] **Step 3: Implement the DOCX exporter**

Create `src/lib/itinerary-docx.ts`:

```ts
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import type { ItineraryDocument } from "@/lib/itinerary-document";

export async function exportItineraryDocx(documentModel: ItineraryDocument) {
  const headerParagraph = new Paragraph({
    children: [new TextRun({ text: documentModel.title, bold: true, size: 28 })]
  });

  const metaParagraph = new Paragraph({
    children: [
      new TextRun(
        documentModel.headerFields.map(field => `${field.label}: ${field.value}`).join(documentModel.locale === "zh" ? " | " : " | ")
      )
    ]
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: documentModel.columns.map(column => new TableCell({
          children: [new Paragraph(column.label)]
        }))
      }),
      ...documentModel.rows.map(row => new TableRow({
        children: documentModel.columns.map(column => new TableCell({
          children: [new Paragraph(row[column.key])]
        }))
      }))
    ]
  });

  const doc = new Document({
    sections: [{ children: [headerParagraph, metaParagraph, table] }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${documentModel.fileName}.docx`);
}
```

- [ ] **Step 4: Implement the PDF print helper and staged state transitions**

Create `src/lib/itinerary-print.ts`:

```ts
import { renderItineraryHtml } from "@/lib/itinerary-html";
import type { ItineraryDocument } from "@/lib/itinerary-document";

export type PdfExportPhase = "idle" | "building" | "rendering" | "printing" | "waiting" | "done" | "cancelled" | "error";

export type PdfExportStatus = {
  phase: PdfExportPhase;
  progress: 0 | 25 | 50 | 75 | 100;
  message?: string;
};

const phaseMap: Record<Exclude<PdfExportPhase, "idle">, PdfExportStatus> = {
  building: { phase: "building", progress: 25, message: "正在准备 PDF 内容..." },
  rendering: { phase: "rendering", progress: 50, message: "正在生成打印页..." },
  printing: { phase: "printing", progress: 75, message: "正在打开打印对话框..." },
  waiting: { phase: "waiting", progress: 75, message: "请在系统打印窗口中保存为 PDF" },
  done: { phase: "done", progress: 100, message: "PDF 导出流程已结束" },
  cancelled: { phase: "cancelled", progress: 100, message: "PDF 导出已取消" },
  error: { phase: "error", progress: 100, message: "PDF 导出失败，请检查浏览器弹窗权限后重试" }
};

export function advancePdfExportState(_current: PdfExportPhase, next: Exclude<PdfExportPhase, "idle">) {
  return phaseMap[next];
}

export function renderItineraryPrintHtml(documentModel: ItineraryDocument) {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${documentModel.title}</title><style>@page { size: A4; margin: 12mm; } body { font-family: Arial, sans-serif; color: #111827; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }</style></head><body>${renderItineraryHtml(documentModel)}</body></html>`;
}

export function openItineraryPrintWindow(documentModel: ItineraryDocument) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    throw new Error("PRINT_WINDOW_BLOCKED");
  }

  printWindow.document.open();
  printWindow.document.write(renderItineraryPrintHtml(documentModel));
  printWindow.document.close();

  return printWindow;
}
```

- [ ] **Step 5: Run the tests for document, HTML, and print helpers**

Run:

```bash
pnpm test src/lib/itinerary-document.test.ts src/lib/itinerary-html.test.ts src/lib/itinerary-print.test.ts
```

Expected:

- All three test files pass

- [ ] **Step 6: Commit the exporter modules**

```bash
git add src/lib/itinerary-docx.ts src/lib/itinerary-print.ts src/lib/itinerary-print.test.ts
git commit -m "feat: add itinerary docx and pdf export helpers"
```

### Task 5: Wire export buttons, PDF progress UI, and export orchestration

**Files:**
- Modify: `src/components/visa-form/itinerary-toolbar.tsx`
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Expand the toolbar props for export actions and status**

Update `src/components/visa-form/itinerary-toolbar.tsx`:

```tsx
export type ItineraryToolbarProps = {
  onGenerate: () => void;
  onAddDay: () => void;
  onExportDocx: (locale: "zh" | "en") => void;
  onExportPdf: (locale: "zh" | "en") => void;
  exportDisabled: boolean;
  pdfStatus: {
    visible: boolean;
    targetLabel: string;
    progress: number;
    message: string;
    phase: "idle" | "building" | "rendering" | "printing" | "waiting" | "done" | "cancelled" | "error";
  };
  className?: string;
};
```

- [ ] **Step 2: Render the DOCX/PDF buttons and the staged progress bar**

Use a structure like:

```tsx
<div className={cn("flex flex-col items-end gap-3", className)}>
  <div className="flex flex-wrap items-center justify-end gap-3">
    <Button variant="secondary" onClick={onAddDay}>新增一天行程</Button>
    <Button className="px-5" onClick={onGenerate}>生成中英文行程单</Button>
    <Button variant="outline" disabled={exportDisabled} onClick={() => onExportDocx("zh")}>导出中文 DOCX</Button>
    <Button variant="outline" disabled={exportDisabled} onClick={() => onExportDocx("en")}>导出英文 DOCX</Button>
    <Button variant="outline" disabled={exportDisabled} onClick={() => onExportPdf("zh")}>导出中文 PDF</Button>
    <Button variant="outline" disabled={exportDisabled} onClick={() => onExportPdf("en")}>导出英文 PDF</Button>
  </div>
  {pdfStatus.visible ? (
    <div className="w-full max-w-md rounded-xl border border-border bg-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-foreground">
        <span>{pdfStatus.targetLabel}</span>
        <span>{pdfStatus.progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border/60">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all",
            pdfStatus.phase === "error" && "bg-destructive"
          )}
          style={{ width: `${pdfStatus.progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{pdfStatus.message}</p>
    </div>
  ) : null}
</div>
```

- [ ] **Step 3: Add cached document state and export handlers in `visa-assistant.tsx`**

Add state:

```tsx
const [pdfStatus, setPdfStatus] = useState({
  visible: false,
  targetLabel: "",
  progress: 0,
  message: "",
  phase: "idle" as const
});
```

Add DOCX handler:

```tsx
const handleExportDocx = async (locale: "zh" | "en") => {
  const target = locale === "zh" ? zhItineraryDocument : enItineraryDocument;
  if (!target) return;
  await exportItineraryDocx(target);
};
```

Add PDF handler:

```tsx
const handleExportPdf = async (locale: "zh" | "en") => {
  const target = locale === "zh" ? zhItineraryDocument : enItineraryDocument;
  if (!target) return;

  try {
    setPdfStatus({
      visible: true,
      targetLabel: locale === "zh" ? "中文 PDF" : "英文 PDF",
      ...advancePdfExportState("idle", "building")
    });

    setPdfStatus(prev => ({ ...prev, ...advancePdfExportState("building", "rendering") }));
    const printWindow = openItineraryPrintWindow(target);

    setPdfStatus(prev => ({ ...prev, ...advancePdfExportState("rendering", "printing") }));

    printWindow.addEventListener("afterprint", () => {
      setPdfStatus(prev => ({ ...prev, ...advancePdfExportState(prev.phase, "done") }));
      window.setTimeout(() => setPdfStatus({ visible: false, targetLabel: "", progress: 0, message: "", phase: "idle" }), 2500);
      printWindow.close();
    }, { once: true });

    printWindow.addEventListener("beforeunload", () => {
      setPdfStatus(prev => prev.phase === "done" ? prev : { ...prev, ...advancePdfExportState(prev.phase, "cancelled") });
    }, { once: true });

    setPdfStatus(prev => ({ ...prev, ...advancePdfExportState("printing", "waiting") }));
    printWindow.focus();
    printWindow.print();
  } catch {
    setPdfStatus(prev => ({ ...prev, visible: true, ...advancePdfExportState(prev.phase, "error") }));
    window.setTimeout(() => setPdfStatus({ visible: false, targetLabel: "", progress: 0, message: "", phase: "idle" }), 2500);
  }
};
```

- [ ] **Step 4: Pass the new handlers and disabled state into the toolbar**

Update the toolbar usage:

```tsx
<ItineraryToolbar
  onAddDay={addDay}
  onGenerate={generateItinerary}
  onExportDocx={handleExportDocx}
  onExportPdf={handleExportPdf}
  exportDisabled={!zhItineraryDocument || !enItineraryDocument || pdfStatus.phase === "building" || pdfStatus.phase === "rendering" || pdfStatus.phase === "printing" || pdfStatus.phase === "waiting"}
  pdfStatus={pdfStatus}
/>
```

- [ ] **Step 5: Run the full verification commands**

Run:

```bash
pnpm test
pnpm typecheck
```

Expected:

- All Vitest tests pass
- `tsc --noEmit` exits with code `0`

- [ ] **Step 6: Do the manual browser verification**

Check these flows in the running app:

```text
1. 点击“生成中英文行程单”后，两个预览仍然正常显示。
2. 点击“导出中文 DOCX”后，下载 `.docx` 文件并能在 Word 打开。
3. 点击“导出英文 DOCX”后，下载 `.docx` 文件并能在 Word 打开。
4. 点击“导出中文 PDF”后，状态条依次显示 25% / 50% / 75%，然后进入等待提示。
5. 在打印窗口保存 PDF 后，主页面状态条进入完成态并自动收起。
6. 关闭打印窗口时，主页面状态条显示取消态，再自动收起。
7. 浏览器拦截弹窗时，主页面状态条显示错误态。
```

- [ ] **Step 7: Commit the UI integration**

```bash
git add src/components/visa-form/itinerary-toolbar.tsx src/components/visa-assistant.tsx
git commit -m "feat: add itinerary docx and pdf export ui"
```

## Self-Review

- Spec coverage:
  - 统一文档模型由 Task 2 实现。
  - HTML 预览复用文档模型由 Task 3 实现。
  - DOCX 导出由 Task 4 实现。
  - PDF 打印页与阶段式进度条由 Task 4 和 Task 5 实现。
  - 工具栏按钮、禁用态、完成/取消/错误反馈由 Task 5 实现。
- Placeholder scan:
  - 计划中没有 `TODO`、`TBD`、`implement later` 这类占位项。
  - 每个任务都包含了明确文件路径、代码块和运行命令。
- Type consistency:
  - `ItineraryDocument`、`renderItineraryHtml()`、`exportItineraryDocx()`、`advancePdfExportState()`、`openItineraryPrintWindow()` 在各任务中的命名保持一致。

