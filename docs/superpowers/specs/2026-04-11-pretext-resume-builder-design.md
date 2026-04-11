# Pretext Resume Builder — Design Spec
_Date: 2026-04-11_

## Overview

A WYSIWYG resume editor that uses [Cheng Lou's Pretext](https://github.com/chenglou/pretext) library to automatically resize text in real time, enforcing user-configurable layout constraints (e.g., max pages, max lines per bullet point). Inspired by Jake's Resume template. Built with React + TypeScript, deployed to GitHub Pages.

The primary goal is to produce a space-conscious document — one that always satisfies its layout constraints without the user having to manually tweak font sizes. The secondary goal is to serve as a compelling showcase of Pretext's text measurement capabilities.

---

## User Experience

### Editing
The app presents a single rendered resume page at all times — there is no separate "edit mode" or "preview mode." Every text element (name, contact info, section headers, job titles, bullet points, etc.) is directly clickable and editable in place via `contenteditable`. The resume looks like a finished document at all times.

Sections and entries (individual jobs, projects, education items) can be added and removed via `+` / `−` controls that appear on hover, keeping the interface uncluttered during normal reading.

### Constraint Settings
A collapsible settings panel (outside the resume page area) exposes three configurable constraints:

| Setting | Default | Description |
|---|---|---|
| Max pages | 1 | Maximum number of US Letter pages the resume may occupy |
| Max lines per bullet | 1 | Maximum number of lines any single bullet point may wrap to |
| Minimum font size | 8px | Floor below which font sizes will not shrink |

These settings are persisted to localStorage alongside the resume data.

### Warnings
When content cannot be made to fit within constraints (i.e., minimum font size is reached and overflow remains), the overflowing element is highlighted with a warning color. This signals to the user that the content needs to be shortened rather than further resized.

### Persistence
All resume data and constraint settings autosave to localStorage on every change. Closing and reopening the tab restores the previous state exactly.

### First Visit
On first visit (empty localStorage), the resume is pre-populated with Jake's Resume content as a starting template, giving users a concrete starting point to edit from.

---

## Data Model

The resume is represented as a typed JSON structure:

```ts
type Resume = {
  name: string
  contact: string[] // e.g. ["123-456-7890", "jake@example.com", "linkedin.com/in/jake"]
  sections: Section[]
}

type Section = {
  title: string // e.g. "Experience", "Education"
  entries: Entry[]
}

type Entry = {
  title: string       // e.g. job title or degree
  subtitle: string    // e.g. company name or institution
  location: string
  dateRange: string
  bullets: string[]
}
```

This model is also the JSON export format. It is stored in localStorage and can be downloaded as a `.json` file or re-imported to restore a previous resume.

---

## Typography Hierarchy

Following Jake's Resume, the document uses distinct typographic roles, each controlled by a CSS custom property:

| Role | CSS Variable | Default Size |
|---|---|---|
| Name | `--font-size-name` | 24px |
| Contact line | `--font-size-contact` | 10px |
| Section header | `--font-size-section` | 11px |
| Entry title | `--font-size-entry-title` | 11px |
| Entry subtitle | `--font-size-entry-subtitle` | 10px |
| Bullet text | `--font-size-bullet` | 10px |

A global scale factor (`--global-scale`, a unitless multiplier starting at `1.0`) is applied on top of all roles when page overflow occurs. It is implemented by multiplying each CSS font-size variable by `--global-scale` at the point of use (e.g., `calc(var(--font-size-bullet) * var(--global-scale))`), uniformly shrinking all text proportionally without using CSS transforms (which would distort the layout geometry Pretext depends on).

---

## Resize Engine

### Overview
The resize engine runs as a React `useEffect` triggered after every content change. It uses Pretext to measure text and enforces two constraints in order:

1. **Per-bullet single-line constraint** (local)
2. **Page overflow constraint** (global)

### Dimensions
The `ResumePage` component is rendered at US Letter proportions: **816 × 1056px** (8.5" × 11" at 96 DPI). This is the canonical pixel space for all layout measurement. `pageHeightPx = maxPages × 1056`.

`columnWidth` is the pixel width of the bullet text content area within `ResumePage`: the page width (816px) minus left/right margins (each 48px) minus bullet indent (16px) = **704px**. This value is a layout constant, not derived from the DOM at runtime.

### Per-Bullet Resize
For each bullet in the resume:
1. Call `prepareWithSegments(bulletText, currentBulletFont)` where `currentBulletFont` is the canvas font shorthand reflecting the bullet's current effective font size (e.g., `"10px 'Computer Modern'"`).
2. Call `measureLineStats(prepared, columnWidth)`
3. If `lineCount > maxLinesPerBullet`: binary search the bullet's font size downward until `lineCount <= maxLinesPerBullet` or `fontSize <= minFontSize`
4. If `lineCount < maxLinesPerBullet` and `fontSize < defaultBulletSize`: binary search upward to recover font size (up to the default)
5. Update `--font-size-bullet-{entryIndex}-{bulletIndex}` CSS variable

Each bullet gets its own CSS variable so they resize independently.

### Page Overflow Resize
After all per-bullet resizes are applied:
1. Read the rendered resume container's total height from the DOM (a single `getBoundingClientRect` after CSS variable updates settle)
2. Compare against `maxPages * pageHeightPx`
3. If overflow: binary search `--global-scale` downward (starting from current value, stepping by 0.5px equivalent) until the document fits or `minFontSize` floor is hit across all roles
4. If underflow and `--global-scale < 1.0`: binary search upward to recover toward 1.0

### Binary Search Parameters
- Precision: 0.5px (sufficient for text layout)
- Max iterations: 20 (prevents runaway loops on edge cases)
- Converge: stop when `high - low < 0.5`

### Fast Path
Before running the full measurement pass, the engine checks two conditions:
1. The last measured document height is below 95% of `pageHeightPx` (well within the page limit)
2. No bullet's text content has changed since the last pass (tracked by storing the previous text strings)

If both conditions are true, the full measurement pass is skipped. This handles the common case of typing in non-bullet fields (name, job title, etc.) without triggering unnecessary Pretext work.

---

## Component Structure

```
App
├── SettingsPanel          — constraint configuration, collapsed by default
├── ResumePage             — fixed-size container (US Letter proportions)
│   ├── ResumeHeader       — name + contact line
│   └── Section[]
│       ├── SectionHeader
│       └── Entry[]
│           ├── EntryHeader  — title, subtitle, location, date
│           └── Bullet[]     — each independently sized
├── Toolbar                — Export PDF, Export JSON, Import JSON, Reset to template
└── useResizeEngine        — custom hook encapsulating all Pretext measurement logic
```

### useResizeEngine
A custom hook that:
- Subscribes to resume data changes
- Runs the resize algorithm (per-bullet, then global)
- Writes CSS custom properties to the document root
- Marks overflowing elements for warning display
- Returns a `warnings` map (entry/bullet index → boolean) for components to render warning states

---

## Export

### PDF Export
Uses `html2canvas` to capture the `ResumePage` DOM node as a canvas, then `jsPDF` to embed it in a PDF at US Letter dimensions. Since the layout is already constraint-satisfied by the resize engine, the captured output will never have overflow.

### JSON Export
Serializes the current resume data model to a formatted `.json` file and triggers a browser download. This serves as the portable save format for users who want to preserve their work outside localStorage or share it.

### JSON Import
A file input accepts a previously exported `.json` file, parses it, validates it against the data model shape, and replaces the current resume state (with a confirmation prompt to avoid accidental data loss).

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Component model fits structured document editing |
| Build tool | Vite | Fast dev server, straightforward GitHub Pages deploy |
| Text measurement | `@chenglou/pretext` | Core library; enables DOM-free, reflow-free measurement |
| PDF export | `html2canvas` + `jsPDF` | Client-side, no server required |
| Hosting | GitHub Pages | Free, static, no backend needed |
| Persistence | localStorage | Simple, sufficient for single-user tool |

---

## Out of Scope (Future Work)

- Import from PDF, DOCX, LaTeX, or plain text
- Multiple resume templates beyond Jake's Resume
- Cloud persistence or user accounts
- Collaborative editing
- Custom section types beyond Education / Experience / Projects / Skills
- Server-side PDF rendering
