# Mobile Compact Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the visa assistant noticeably more compact on mobile without changing existing form logic or desktop layout behavior.

**Architecture:** Keep the current component structure and business logic intact, then tighten spacing through responsive Tailwind class changes at the page shell, primary cards, secondary cards, and preview surfaces. Apply smaller default mobile spacing and use `md:` / `lg:` overrides to preserve the current larger-screen rhythm.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui

---

### Task 1: Tighten The Top-Level Page Shell

**Files:**
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Shrink the outer page container and top spacing**

```tsx
<main className="mx-auto w-[min(1260px,96vw)] px-1 py-4 sm:px-0 sm:py-6 lg:w-[min(1260px,94vw)] lg:py-8">
```

This keeps the current desktop width while reducing vertical whitespace on mobile and slightly widening the usable small-screen content area.

- [ ] **Step 2: Tighten the hero card spacing and typography**

```tsx
<MagicCard className={cn(panelShellClassName, "p-4 sm:p-5 lg:p-6")}>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="space-y-2 sm:space-y-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          申根签材料助手
        </h1>
        <p className="max-w-3xl text-sm leading-5 text-muted-foreground sm:leading-6 md:text-base">
          用于智能生成行程单、解释信与材料清单，生成前请按实际预订单与个人材料逐项核对。
        </p>
      </div>
    </div>
```

This preserves the structure but reduces mobile height meaningfully.

- [ ] **Step 3: Turn the top action buttons into denser mobile chips**

```tsx
<div className="flex flex-wrap gap-2 lg:justify-end">
  <Button
    type="button"
    variant="outline"
    className="h-9 rounded-full px-3 text-xs sm:px-4 sm:text-sm"
    onClick={resetDraft}
  >
    重置
  </Button>
```

Apply the same `h-9 rounded-full px-3 text-xs sm:px-4 sm:text-sm` treatment to the tab buttons.

- [ ] **Step 4: Compress the disclaimer and itinerary section chrome**

```tsx
<div className="mb-4 rounded-xl border border-border bg-muted/70 px-3 py-2 text-xs font-semibold leading-5 text-muted-foreground sm:mb-6 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
```

```tsx
<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 lg:px-6">
```

```tsx
<div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
```

Use the same pattern for the letter and checklist tab wrapper cards so all three tabs share the compact rhythm.

### Task 2: Compact The Base Form And Preview Cards

**Files:**
- Modify: `src/components/visa-form/trip-basics-section.tsx`
- Modify: `src/components/visa-form/generated-preview.tsx`

- [ ] **Step 1: Tighten the base form card header and content spacing**

```tsx
<CardHeader className="border-b border-border px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
  <CardTitle className="text-base font-semibold text-foreground sm:text-lg">基础信息</CardTitle>
</CardHeader>
<CardContent className="grid gap-4 px-4 pb-4 pt-4 sm:gap-5 sm:px-6 sm:pb-6 sm:pt-5 md:grid-cols-2 xl:grid-cols-4">
```

This keeps the current information density but reduces the amount of breathing room on mobile.

- [ ] **Step 2: Tighten key field blocks without shrinking tap targets**

```tsx
<div className="space-y-1">
```

Use `space-y-1` for the repeated label/input wrappers and keep the actual input/button components unchanged so clickability stays intact.

- [ ] **Step 3: Tighten the readonly date blocks and action row**

```tsx
<div className="grid gap-2 sm:grid-cols-2 xl:col-span-2">
```

```tsx
<div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
```

```tsx
<div className="xl:col-span-4">
  <Button type="button" variant="outline" className="h-9 bg-card px-3 text-sm" onClick={onAutoBuildDays}>
    生成行程安排表
  </Button>
</div>
```

- [ ] **Step 4: Tighten preview card spacing**

```tsx
<CardHeader className="border-b border-border px-4 pb-3 pt-4 sm:px-6">
  <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
</CardHeader>
<CardContent className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
  <ScrollArea className="min-h-40 rounded-lg border border-border bg-muted/40">
    <div className="min-h-40 p-3 text-sm text-foreground" />
  </ScrollArea>
  <div className="mt-3 border-t border-border pt-3">
```

This makes preview panels visually lighter without affecting the editable surface behavior.

### Task 3: Compact The Day Card

**Files:**
- Modify: `src/components/visa-form/day-card.tsx`

- [ ] **Step 1: Shrink the day card header**

```tsx
<CardHeader className="border-b border-border bg-muted/40 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
  <div className="space-y-1.5 sm:space-y-2">
    <div className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground sm:px-3 sm:text-xs">
      DAY {index + 1}
    </div>
    <div className="space-y-0.5">
      <h3 className="text-base font-semibold text-foreground sm:text-lg">第 {index + 1} 天行程安排</h3>
      <p className="text-xs text-muted-foreground sm:text-sm">逐日维护城市、景点、酒店与交通信息。</p>
    </div>
  </div>
</CardHeader>
```

- [ ] **Step 2: Tighten the card content and section shells**

```tsx
<CardContent className="space-y-4 px-4 pb-4 pt-4 sm:space-y-5 sm:px-6 sm:pb-6 sm:pt-5">
```

```tsx
<section className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
```

Apply the `p-3 sm:p-4` shell to the date, city/scenic, hotel, and transport sections.

- [ ] **Step 3: Tighten the city row block and scenic chooser**

```tsx
<div key={...} className="rounded-xl border border-border bg-card p-3 sm:p-4">
  <div className="grid gap-3 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_auto] xl:items-start">
```

```tsx
<div className="space-y-2 rounded-lg border border-border bg-background/80 p-2.5 sm:p-3">
```

```tsx
<label
  className={cn(
    "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition",
    checked ? "border-primary/40 bg-primary/5" : "border-border bg-background hover:border-foreground/20"
  )}
>
```

This reduces the vertical expansion of each selected city while preserving the existing city/scenic data model.

- [ ] **Step 4: Tighten the transport and helper blocks**

```tsx
<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
```

```tsx
<label
  className={cn(
    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition",
    checked ? "border-primary/40 bg-background text-foreground" : "border-border bg-background/80 text-muted-foreground hover:border-foreground/20"
  )}
>
```

```tsx
{day.transports.includes("飞机") && (
  <div className="mt-3 grid gap-3 md:grid-cols-3">
```

```tsx
<div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
```

### Task 4: Apply The Same Compact Rhythm To Letter And Checklist Tabs

**Files:**
- Modify: `src/components/visa-assistant.tsx`

- [ ] **Step 1: Tighten the letter tab card and header spacing**

```tsx
<MagicCard className={cn(panelShellClassName, "p-4 sm:p-5 lg:p-6")}>
  <div className="mb-3 space-y-1 sm:mb-4">
```

```tsx
<div className="grid gap-3 md:grid-cols-2">
```

```tsx
<div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
```

Keep the existing field order and contentEditable blocks unchanged.

- [ ] **Step 2: Tighten the letter editor surfaces**

```tsx
<Textarea className="mt-3" ... />
<div className="mt-3">
  <Button type="button" onClick={generateLetter}>生成中英文解释信</Button>
</div>
<div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
```

```tsx
<div className="mt-3 grid gap-3 md:grid-cols-2">
  <div className="min-h-40 rounded-xl border border-border bg-background p-3" />
```

- [ ] **Step 3: Tighten the checklist tab**

```tsx
<MagicCard className={cn(panelShellClassName, "p-4 sm:p-5 lg:p-6")}>
  <div className="mb-3 space-y-1 sm:mb-4">
```

```tsx
<div className="space-y-2">
  <label key={m[0]} className="flex items-start gap-2 rounded-xl border border-border bg-background p-2.5 sm:p-3">
```

This keeps the list readable but makes each checklist row slightly denser on phones.

### Task 5: Minimal Verification Per User Request

**Files:**
- Modify: `src/components/visa-assistant.tsx`
- Modify: `src/components/visa-form/trip-basics-section.tsx`
- Modify: `src/components/visa-form/day-card.tsx`
- Modify: `src/components/visa-form/generated-preview.tsx`

- [ ] **Step 1: Skip full self-test as requested**

Do not run full project tests or browser walkthroughs unless the implementation introduces an obvious problem that must be diagnosed.

- [ ] **Step 2: Check diagnostics for edited files**

Use IDE diagnostics for:
- `src/components/visa-assistant.tsx`
- `src/components/visa-form/trip-basics-section.tsx`
- `src/components/visa-form/day-card.tsx`
- `src/components/visa-form/generated-preview.tsx`

Expected: no new TypeScript or lint diagnostics introduced by the spacing changes.

- [ ] **Step 3: Keep the diff focused**

Limit code edits to spacing, sizing, and responsive typography classes unless an adjacent refactor is required to keep class names readable.
