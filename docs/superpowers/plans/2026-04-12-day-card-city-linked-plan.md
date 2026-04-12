# Day Card City-Linked Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the itinerary day card so each row binds one city to its own scenic selector, while updating itinerary generation for cross-city transport and broader flight airport candidates.

**Architecture:** Keep the existing `DayItem -> CountryRow -> CityRow` model and add helper functions in `visa-assistant.tsx` to edit city rows directly instead of relying on a summary-management panel. Update `day-card.tsx` to render one editable row per city, remove the summary `div` and the whole “已录入城市与景点” block, then generate cross-city transport text from the previous day’s primary city to the current day’s primary city using the current day transport fields.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind CSS, existing UI components, existing cascader/select components

---

### Task 1: Add row-level city editing helpers

**Files:**
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Add helper functions for empty city rows and flattening city rows**

```tsx
function emptyCityRow(): CityRow {
  return {
    city: "",
    scenics: [],
    scenicDraft: ""
  };
}

function getDayCityEntries(day: DayItem) {
  return day.countryRows.flatMap((row, countryIndex) =>
    row.cityRows.map((cityRow, cityIndex) => ({
      country: row.country,
      cityRow,
      countryIndex,
      cityIndex
    }))
  );
}
```

- [ ] **Step 2: Add row-level update helpers on `VisaAssistant`**

```tsx
const setCityRowValue = (
  dayIndex: number,
  targetCountryIndex: number,
  targetCityIndex: number,
  patch: Partial<CityRow>
) => {
  updateCountryRows(dayIndex, rows =>
    rows.map((row, countryIndex) => (
      countryIndex === targetCountryIndex
        ? {
            ...row,
            cityRows: row.cityRows.map((cityRow, cityIndex) => (
              cityIndex === targetCityIndex ? { ...cityRow, ...patch } : cityRow
            ))
          }
        : row
    ))
  );
};

const addEmptyCityRow = (dayIndex: number) => {
  updateCountryRows(dayIndex, rows => {
    const nextRows = [...rows];
    const firstFilledRowIndex = nextRows.findIndex(row => row.country);

    if (firstFilledRowIndex === -1) {
      return [{ ...emptyCountryRow(), cityRows: [emptyCityRow()] }];
    }

    nextRows[firstFilledRowIndex] = {
      ...nextRows[firstFilledRowIndex],
      cityRows: [...nextRows[firstFilledRowIndex].cityRows, emptyCityRow()]
    };
    return nextRows;
  });
};
```

- [ ] **Step 3: Add helpers for selecting city and scenic on a specific row**

```tsx
const setDayCitySelection = (dayIndex: number, countryIndex: number, cityIndex: number, selection: string[]) => {
  const { country, city } = parseCascaderSelection(selection);
  if (!country || !city) return;

  updateCountryRows(dayIndex, rows => rows.map((row, index) => {
    if (index !== countryIndex) return row;
    return {
      ...row,
      country,
      cityRows: row.cityRows.map((cityRow, currentIndex) => (
        currentIndex === cityIndex
          ? { ...cityRow, city, scenics: cityRow.city === city ? cityRow.scenics : [] }
          : cityRow
      ))
    };
  }));
};

const setDayScenicSelection = (dayIndex: number, countryIndex: number, cityIndex: number, selection: string[]) => {
  const { city, scenic } = parseCascaderSelection(selection);
  if (!city || !scenic) return;

  updateCountryRows(dayIndex, rows => rows.map((row, index) => (
    index === countryIndex
      ? {
          ...row,
          cityRows: row.cityRows.map((cityRow, currentIndex) => (
            currentIndex === cityIndex && cityRow.city === city
              ? {
                  ...cityRow,
                  scenics: cityRow.scenics.includes(scenic) ? cityRow.scenics : [...cityRow.scenics, scenic]
                }
              : cityRow
          ))
        }
      : row
  )));
};
```

- [ ] **Step 4: Add helper for previous-day-aware airport candidates**

```tsx
const getAirportCandidates = (day: DayItem, previousDay?: DayItem) => {
  const currentCities = day.countryRows.flatMap(row => row.cityRows.map(cityRow => cityRow.city));
  const previousPrimaryCity = previousDay ? getPrimaryCity(previousDay) : "";
  const airportOptions = Array.from(
    new Set(
      [...(previousPrimaryCity ? [previousPrimaryCity] : []), ...currentCities]
        .flatMap(cityName => cityAirportMap[cityName] || [])
    )
  );

  return airportOptions.length ? airportOptions : ["其他机场"];
};
```

### Task 2: Rebuild `day-card.tsx` into city-linked rows

**Files:**
- Modify: `src/components/visa-form/day-card.tsx`

- [ ] **Step 1: Replace the current props with row-oriented props**

Update `DayCardProps` to remove:

```tsx
onApplyCascaderSelection: (selection: string[]) => void;
onRemoveCountryRow: (countryIndex: number) => void;
```

And add:

```tsx
onAddCityRow: () => void;
onSelectCityRow: (countryIndex: number, cityIndex: number, selection: string[]) => void;
onSelectScenicRow: (countryIndex: number, cityIndex: number, selection: string[]) => void;
```

- [ ] **Step 2: Derive a flat list of visible city rows inside the component**

```tsx
const cityEntries = React.useMemo(
  () => day.countryRows.flatMap((row, countryIndex) =>
    row.cityRows.map((cityRow, cityIndex) => ({
      country: row.country,
      cityRow,
      countryIndex,
      cityIndex
    }))
  ),
  [day.countryRows]
);
```

- [ ] **Step 3: Remove summary chips and the whole management section**

Delete:
- `showStructurePanel`
- city summary `div`
- scenic summary `div`
- the entire “已录入城市与景点” block

- [ ] **Step 4: Render one row per city**

Use a structure like:

```tsx
<div className="space-y-3">
  {cityEntries.map(({ country, cityRow, countryIndex, cityIndex }, rowIndex) => (
    <div key={`${countryIndex}-${cityIndex}-${rowIndex}`} className="grid gap-3 rounded-xl border border-border bg-background p-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_auto]">
      <div className="space-y-1.5">
        <Label>游览城市{rowIndex === 0 ? "" : ` ${rowIndex + 1}`}</Label>
        <Cascader
          options={cascaderOptions}
          onChange={selection => onSelectCityRow(countryIndex, cityIndex, selection)}
          placeholder="选择国家 / 城市"
          className="w-full bg-card"
          popupClassName="min-w-[320px]"
          value={country && cityRow.city ? [country, cityRow.city] : undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label>游览景点</Label>
        <Cascader
          options={cascaderOptions}
          onChange={selection => onSelectScenicRow(countryIndex, cityIndex, selection)}
          placeholder={cityRow.city ? `为 ${cityRow.city} 选择景点` : "请先选择城市"}
          className="w-full bg-card"
          popupClassName="min-w-[320px]"
          disabled={!cityRow.city}
        />
      </div>
      <div className="flex items-end">
        <Button
          type="button"
          variant="destructiveOutline"
          size="sm"
          className="w-full lg:w-auto"
          onClick={() => onRemoveCity(countryIndex, cityIndex)}
        >
          删除城市
        </Button>
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 5: Keep scenic chips within the same row only**

Under each row’s scenic selector, render only that row’s `cityRow.scenics` with delete buttons:

```tsx
{cityRow.scenics.length ? (
  <div className="flex flex-wrap gap-2">
    {cityRow.scenics.map((scenic, scenicIndex) => (
      <div key={`${scenic}-${scenicIndex}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-1 text-xs text-foreground">
        <span>{scenic}</span>
        <Button
          type="button"
          variant="destructiveOutline"
          size="icon"
          className="size-5 rounded-full"
          onClick={() => onRemoveScenic(countryIndex, cityIndex, scenicIndex)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    ))}
  </div>
) : null}
```

- [ ] **Step 6: Make `+新增游览城市` append a new row**

```tsx
<Button type="button" variant="outline" size="sm" className="bg-card" onClick={onAddCityRow}>
  + 新增游览城市
</Button>
```

### Task 3: Update parent wiring and itinerary generation

**Files:**
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Wire the new `DayCard` props**

Update the render call:

```tsx
<DayCard
  index={i}
  day={d}
  countryOptions={countryOptions}
  airportCandidates={getAirportCandidates(d, i > 0 ? days[i - 1] : undefined)}
  timeHint={getTimeHint(d)}
  onDateChange={value => updateDay(i, { date: value })}
  onAddCityRow={() => addEmptyCityRow(i)}
  onSelectCityRow={(countryIndex, cityIndex, selection) => setDayCitySelection(i, countryIndex, cityIndex, selection)}
  onSelectScenicRow={(countryIndex, cityIndex, selection) => setDayScenicSelection(i, countryIndex, cityIndex, selection)}
  onRemoveCity={(countryIndex, cityIndex) => removeCity(i, countryIndex, cityIndex)}
  onRemoveScenic={(countryIndex, cityIndex, scenicIndex) => removeScenic(i, countryIndex, cityIndex, scenicIndex)}
  onHotelChange={patch => updateDay(i, patch)}
  onToggleTransport={(transport, checked) => toggleTransport(i, transport, checked)}
  onFlightChange={patch => updateDay(i, patch)}
/>
```

- [ ] **Step 2: Remove unused `DayCard`-related helpers**

Delete:
- `applyCascaderSelection`
- `removeCountryRow`

And remove the corresponding props from `DayCard`.

- [ ] **Step 3: Append cross-city transport text in itinerary output**

Add text to the transport column when the primary city changes:

```tsx
const crossCityTransportCN = includeCheckIn && previousPrimaryCity && currentPrimaryCity
  ? `；跨城交通：${escapeHtml(previousPrimaryCity)} → ${escapeHtml(currentPrimaryCity)}，${transCNBase || "-"}${flightCN}`
  : "";
const crossCityTransportEN = includeCheckIn && previousPrimaryCity && currentPrimaryCity
  ? `; Intercity transfer: ${escapeHtml(cityToEn(previousPrimaryCity))} -> ${escapeHtml(cityToEn(currentPrimaryCity))}, ${transENBase || "-"}${flightEN}`
  : "";

const transCN = transCNBase ? `${transCNBase}${flightCN}${crossCityTransportCN}` : (crossCityTransportCN ? crossCityTransportCN.slice(1) : "-");
const transEN = transENBase ? `${transENBase}${flightEN}${crossCityTransportEN}` : (crossCityTransportEN ? crossCityTransportEN.slice(2) : "-");
```

### Task 4: Verify implementation

**Files:**
- Modify: `src/components/visa-form/day-card.tsx`
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Run type checking**

Run: `pnpm typecheck`
Expected: exit code `0`

- [ ] **Step 2: Check diagnostics**

Check diagnostics for:
- `src/components/visa-form/day-card.tsx`
- `src/components/visa-assistant.tsx`

Expected: no diagnostics

- [ ] **Step 3: Manual verification in the running dev page**

Verify:
- one row shows one city selector and one scenic selector
- clicking `+新增游览城市` appends one new row below the existing row
- selecting a new city row does not change previous rows
- scenic selection stays bound to its own row
- no city summary `div` remains
- no “已录入城市与景点” block remains
- if the current day primary city differs from the previous day, the transport column includes previous-day-city to current-day-city transport text
- if current day transport includes flight, airport choices include airports from the previous day primary city and current day cities
