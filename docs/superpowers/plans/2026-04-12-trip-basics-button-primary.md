# Trip Basics Button Primary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the `生成行程安排表` button in `TripBasicsSection` from outline styling to the project's default primary button styling.

**Architecture:** Keep the existing `Button` component, click handler, text, and size classes unchanged. Only remove the local `outline` variant override so the button falls back to the shared default `bg-primary` styling defined in the design system.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui button

---

### Task 1: Switch The Button To Primary Styling

**Files:**
- Modify: `src/components/visa-form/trip-basics-section.tsx`

- [ ] **Step 1: Remove the outline variant from the action button**

Replace:

```tsx
<Button type="button" variant="outline" className="h-9 bg-card px-3 text-sm" onClick={onAutoBuildDays}>
  生成行程安排表
</Button>
```

With:

```tsx
<Button type="button" className="h-9 px-3 text-sm" onClick={onAutoBuildDays}>
  生成行程安排表
</Button>
```

This preserves the existing height and spacing while letting `Button` use its default primary visual style.

- [ ] **Step 2: Check diagnostics for the edited file**

Use IDE diagnostics for:
- `src/components/visa-form/trip-basics-section.tsx`

Expected: no new TypeScript or lint diagnostics introduced by the change.

- [ ] **Step 3: Keep the running dev server available for visual review**

Do not restart the existing `pnpm dev --port 3010` process unless the change fails to hot reload. The user is already reviewing the page through the running server.
