# Day Card Layout B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the itinerary day card into the simpler "layout B" form while keeping the current visual style and adding the check-in sentence when the city changes from the previous day.

**Architecture:** Keep the existing `DayItem` and route data model so the form still uses the current cascader-driven country/city/scenic structure. Rebuild `day-card.tsx` around a primary form-first layout, move the structural management UI into a secondary collapsible section, and update `visa-assistant.tsx` generation logic so the itinerary output appends the hotel check-in note when the main city changes across days.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind CSS, existing UI components, `react-day-picker`

---

### Task 1: Re-layout the day form

**Files:**
- Modify: `src/components/visa-form/day-card.tsx`

- [ ] **Step 1: Add local UI state for the secondary structure panel**

```tsx
const [showStructurePanel, setShowStructurePanel] = React.useState(false);
```

- [ ] **Step 2: Derive lightweight summaries for cities and scenics**

```tsx
const citySummaries = React.useMemo(
  () => filledCountryRows.flatMap(({ row }) => row.cityRows.map(cityRow => ({
    country: row.country,
    city: cityRow.city
  }))),
  [filledCountryRows]
);

const scenicSummaries = React.useMemo(
  () => filledCountryRows.flatMap(({ row }) =>
    row.cityRows.flatMap(cityRow =>
      cityRow.scenics.map(scenic => ({
        city: cityRow.city,
        scenic
      }))
    )
  ),
  [filledCountryRows]
);
```

- [ ] **Step 3: Replace the current card body with a form-first layout**

Use this section order:

```tsx
<CardContent className="space-y-5 pt-5">
  <section>{日期 + 必填提示}</section>
  <section>{游览城市 + 游览景点主表单}</section>
  <section>{住宿信息三列}</section>
  <section>{主要交通方式}</section>
  <section>{次级结构折叠区}</section>
</CardContent>
```

Requirements inside the new layout:
- date input remains editable and stays auto-filled by base trip dates
- city area uses the existing `Cascader` entry for country/city/scenic additions
- city area shows selected country/city chips
- scenic area shows selected scenic chips
- add a secondary action to reveal the structural management area
- keep current card tone, border, rounded corners, and typography scale

- [ ] **Step 4: Preserve delete and cleanup actions inside the secondary structure panel**

Move the current "停留国家与景点结构" block into a collapsible section with a trigger like:

```tsx
<Button
  type="button"
  variant="ghost"
  className="h-8 px-0 text-xs text-muted-foreground"
  onClick={() => setShowStructurePanel(value => !value)}
>
  {showStructurePanel ? "收起已录入城市与景点" : "查看已录入城市与景点"}
</Button>
```

Inside the expanded panel, keep:
- delete country segment
- delete city
- delete scenic
- summary counts

### Task 2: Update itinerary generation rule

**Files:**
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Add a helper for the day’s primary city**

```tsx
function getPrimaryCity(day: DayItem) {
  return getPreviewPoints(day)[0] || "";
}
```

- [ ] **Step 2: Append the hotel check-in sentence when the primary city changes**

Update `generateItinerary()` so the scenic column logic becomes:

```tsx
const previousPrimaryCity = idx > 0 ? getPrimaryCity(days[idx - 1]) : "";
const currentPrimaryCity = getPrimaryCity(d);
const includeCheckIn = Boolean(idx > 0 && currentPrimaryCity && previousPrimaryCity && currentPrimaryCity !== previousPrimaryCity);

const scenicPartsCN = scenicRows.length
  ? scenicRows.map(row => `${escapeHtml(row.city)}：${row.scenics.map(escapeHtml).join("、")}`)
  : [];
if (includeCheckIn) scenicPartsCN.push("办理入住");
const scenicCN = scenicPartsCN.join("；") || "-";

const scenicPartsEN = scenicRows.length
  ? scenicRows.map(row => {
      const scenicNames = row.scenics.map(scenic => {
        const hit = Object.values(scenicMap).flat().find(v => v[0] === scenic);
        return escapeHtml(hit?.[1] || scenic);
      });
      return `${escapeHtml(cityToEn(row.city))}: ${scenicNames.join(", ")}`;
    })
  : [];
if (includeCheckIn) scenicPartsEN.push("Hotel check-in");
const scenicEN = scenicPartsEN.join("; ") || "-";
```

### Task 3: Verify changed files

**Files:**
- Modify: `src/components/visa-form/day-card.tsx`
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Run TypeScript verification**

Run: `pnpm typecheck`
Expected: exit code `0`

- [ ] **Step 2: Check IDE diagnostics**

Check:
- `src/components/visa-form/day-card.tsx`
- `src/components/visa-assistant.tsx`

Expected: no new diagnostics

- [ ] **Step 3: Manually verify in the running dev page**

Verify:
- main day card first screen shows simpler form-first layout
- city and scenic areas no longer dominate the card visually
- structural management UI is hidden until expanded
- existing add/delete city and scenic flows still work
- generated itinerary adds `办理入住` only when the primary city changes from the previous day
