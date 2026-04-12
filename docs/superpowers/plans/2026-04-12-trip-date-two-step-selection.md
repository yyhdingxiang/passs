# Trip Date Two-Step Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `trip-basics-section.tsx` keep the calendar open after the first click, then let the user click a return date to complete the trip range, including same-day round trips.

**Architecture:** Keep the parent API unchanged and move the selection flow control into `TripBasicsSection`. Replace the current direct `react-day-picker` range completion handling with a small internal two-step state machine that tracks whether the next click is choosing the departure date or the return date, while still rendering the selected range through the existing `Calendar` wrapper.

**Tech Stack:** Next.js, React 19, TypeScript, `react-day-picker`, `date-fns`

---

### Task 1: Add Two-Step Range Selection State

**Files:**
- Modify: `src/components/visa-form/trip-basics-section.tsx`

- [ ] **Step 1: Add the local selection phase state**

```tsx
const [datePickerOpen, setDatePickerOpen] = React.useState(false);
const [pendingStartDate, setPendingStartDate] = React.useState<Date | undefined>(undefined);
```

Use `pendingStartDate` to represent "the first click happened, waiting for the return date".

- [ ] **Step 2: Derive the visible range from parent values plus the pending start**

```tsx
const selectedRange = React.useMemo<DateRange | undefined>(() => {
  const from = pendingStartDate ?? parseDate(tripStartDate);
  const to = parseDate(tripEndDate);
  if (!from && !to) return undefined;
  if (from && !to) return { from, to: from };
  return { from, to };
}, [pendingStartDate, tripEndDate, tripStartDate]);
```

This keeps the first clicked date visibly selected while the user is choosing the return date.

- [ ] **Step 3: Replace the current `handleRangeSelect` with two-step logic**

```tsx
const updateTripRange = (start: Date, end: Date) => {
  const [from, to] = start <= end ? [start, end] : [end, start];
  onTripRangeChange({
    start: format(from, "yyyy-MM-dd"),
    end: format(to, "yyyy-MM-dd")
  });
};

const handleDaySelect = (date: Date | undefined) => {
  if (!date) return;

  if (!pendingStartDate) {
    setPendingStartDate(date);
    onTripRangeChange({
      start: format(date, "yyyy-MM-dd"),
      end: ""
    });
    return;
  }

  updateTripRange(pendingStartDate, date);
  setPendingStartDate(undefined);
  setDatePickerOpen(false);
};
```

This guarantees:
- first click sets departure only
- second click sets return date
- same-day click produces same start/end
- reversed second click is normalized

- [ ] **Step 4: Reset the pending state when reopening or clearing**

```tsx
const handleDatePickerOpenChange = (open: boolean) => {
  setDatePickerOpen(open);
  if (!open) {
    setPendingStartDate(undefined);
  } else if (tripStartDate && tripEndDate) {
    setPendingStartDate(undefined);
  }
};
```

Use this handler on `Popover` instead of passing `setDatePickerOpen` directly.

- [ ] **Step 5: Wire `Calendar` to day-based selection instead of direct range selection**

```tsx
<Calendar
  mode="single"
  numberOfMonths={2}
  selected={pendingStartDate ?? parseDate(tripStartDate)}
  defaultMonth={pendingStartDate ?? selectedRange?.from}
  onSelect={handleDaySelect}
  modifiers={{
    range_start: selectedRange?.from ? [selectedRange.from] : [],
    range_end: selectedRange?.to ? [selectedRange.to] : [],
    range_middle:
      selectedRange?.from && selectedRange?.to && selectedRange.from.getTime() !== selectedRange.to.getTime()
        ? [{ from: selectedRange.from, to: selectedRange.to }]
        : []
  }}
/>
```

This keeps control in the component while preserving the existing range styling hooks.

### Task 2: Update Labels And Verification

**Files:**
- Modify: `src/components/visa-form/trip-basics-section.tsx`

- [ ] **Step 1: Keep the button label aligned with pending selection**

```tsx
function formatRangeLabel(range: DateRange | undefined, hasPendingReturn: boolean) {
  if (range?.from && range?.to && !hasPendingReturn) {
    return `${format(range.from, "yyyy-MM-dd")} - ${format(range.to, "yyyy-MM-dd")}`;
  }
  if (range?.from) {
    return `${format(range.from, "yyyy-MM-dd")} - 请选择返回日期`;
  }
  return "选择出发和返回日期";
}
```

Call it with `Boolean(pendingStartDate && !tripEndDate)`.

- [ ] **Step 2: Run type checking**

Run: `pnpm typecheck`
Expected: exit code `0`

- [ ] **Step 3: Check diagnostics for the edited file**

Run the IDE diagnostics for:
- `src/components/visa-form/trip-basics-section.tsx`

Expected: no new TypeScript or lint diagnostics introduced by this change.

- [ ] **Step 4: Manually verify the calendar flow**

Verify in the browser:
- first click leaves the popover open
- second click closes the popover
- clicking the same day twice creates same-day start/end
- clicking an earlier second day still stores the range in chronological order
- the readonly start/end fields update after each click

- [ ] **Step 5: Commit**

```bash
git add src/components/visa-form/trip-basics-section.tsx
git commit -m "feat: add two-step trip date selection"
```
