# Presume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WYSIWYG resume editor that uses Pretext to auto-resize text to satisfy configurable layout constraints, deployed to GitHub Pages.

**Architecture:** A React app with a fixed-size `ResumePage` component (816×1056px US Letter) where every text element is `contenteditable`. A `useResizeEngine` hook runs after each content change — first shrinking individual bullets to fit their line-count constraint (using Pretext measurement), then adjusting a global CSS scale factor to fit the page limit. All font sizes are CSS custom properties so Pretext measurements and DOM layout stay in sync.

**Tech Stack:** React 18 + TypeScript, Vite, `@chenglou/pretext` (text measurement), `html2canvas` + `jsPDF` (PDF export), Vitest + jsdom (tests), GitHub Pages (hosting).

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | HTML entry point, Google Fonts link |
| `vite.config.ts` | Vite config with `/presume/` base for GitHub Pages |
| `tsconfig.json` / `tsconfig.node.json` | TypeScript config |
| `src/main.tsx` | React root render |
| `src/App.tsx` | Root component — wires all hooks and components |
| `src/types.ts` | `Resume`, `Section`, `Entry`, `Constraints` types + `validateResume` |
| `src/defaultResume.ts` | Jake's Resume template as default data |
| `src/storage.ts` | localStorage load/save helpers |
| `src/useResume.ts` | Resume + constraints state, autosave |
| `src/useResizeEngine.ts` | Pretext measurement, CSS var writes, warnings map |
| `src/export.ts` | PDF export, JSON export, JSON import |
| `src/components/EditableText.tsx` | Shared `contenteditable` span with stable cursor |
| `src/components/SettingsPanel.tsx` | Collapsible constraints config panel |
| `src/components/Toolbar.tsx` | Export PDF / JSON, Import JSON, Reset buttons |
| `src/components/ResumePage.tsx` | US Letter container, `forwardRef` for PDF capture |
| `src/components/ResumeHeader.tsx` | Name + contact line |
| `src/components/Section.tsx` | Section with header + entries + add/remove controls |
| `src/components/Entry.tsx` | Entry with header + bullets + add/remove controls |
| `src/components/Bullet.tsx` | Single bullet, independently sized via CSS var |
| `src/styles/resume.css` | Resume typography, layout, CSS custom properties |
| `src/styles/app.css` | App shell, toolbar, settings panel |
| `src/tests/types.test.ts` | `validateResume` unit tests |
| `src/tests/storage.test.ts` | localStorage load/save tests |
| `src/tests/resizeEngine.test.ts` | `binarySearchFontSize` pure function tests |
| `.github/workflows/deploy.yml` | GitHub Pages deployment |

---

## Task 1: Scaffold the Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "presume",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "@chenglou/pretext": "^0.11.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^26.1.0",
    "typescript": "~5.7.2",
    "vite": "^6.3.1",
    "vitest": "^3.1.2"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/presume/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
})
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 4: Create `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presume</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 8: Create `src/tests/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`

Expected: `node_modules` directory created, no errors.

- [ ] **Step 10: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/main.tsx src/tests/setup.ts
git commit -m "feat: scaffold Vite + React + TypeScript project with Vitest"
```

---

## Task 2: Types and Validation

**Files:**
- Create: `src/types.ts`
- Create: `src/tests/types.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/tests/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateResume } from '../types'

describe('validateResume', () => {
  it('accepts a valid resume', () => {
    const valid = {
      name: 'Jake Ryan',
      contact: ['jake@example.com'],
      sections: [
        {
          title: 'Experience',
          entries: [
            {
              title: 'Engineer',
              subtitle: 'Acme',
              location: 'NYC',
              dateRange: '2020–2022',
              bullets: ['Did things'],
            },
          ],
        },
      ],
    }
    expect(validateResume(valid)).toEqual(valid)
  })

  it('rejects null', () => {
    expect(validateResume(null)).toBeNull()
  })

  it('rejects missing name', () => {
    expect(validateResume({ contact: [], sections: [] })).toBeNull()
  })

  it('rejects non-string contact items', () => {
    expect(validateResume({ name: 'Jake', contact: [123], sections: [] })).toBeNull()
  })

  it('rejects missing entry fields', () => {
    const bad = {
      name: 'Jake',
      contact: [],
      sections: [
        {
          title: 'Experience',
          entries: [{ title: 'Eng' }], // missing subtitle, location, dateRange, bullets
        },
      ],
    }
    expect(validateResume(bad)).toBeNull()
  })

  it('rejects non-string bullets', () => {
    const bad = {
      name: 'Jake',
      contact: [],
      sections: [
        {
          title: 'Experience',
          entries: [
            {
              title: 'Eng',
              subtitle: 'Acme',
              location: 'NYC',
              dateRange: '2020',
              bullets: [42],
            },
          ],
        },
      ],
    }
    expect(validateResume(bad)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/tests/types.test.ts`

Expected: FAIL — `validateResume` is not defined.

- [ ] **Step 3: Create `src/types.ts`**

```ts
export type Resume = {
  name: string
  contact: string[]
  sections: ResumeSection[]
}

export type ResumeSection = {
  title: string
  entries: ResumeEntry[]
}

export type ResumeEntry = {
  title: string
  subtitle: string
  location: string
  dateRange: string
  bullets: string[]
}

export type Constraints = {
  maxPages: number
  maxLinesPerBullet: number
  minFontSize: number
}

export const DEFAULT_CONSTRAINTS: Constraints = {
  maxPages: 1,
  maxLinesPerBullet: 1,
  minFontSize: 8,
}

export function validateResume(data: unknown): Resume | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  if (typeof d.name !== 'string') return null
  if (
    !Array.isArray(d.contact) ||
    !d.contact.every((c: unknown) => typeof c === 'string')
  )
    return null
  if (!Array.isArray(d.sections)) return null

  for (const section of d.sections) {
    if (!section || typeof section !== 'object') return null
    const s = section as Record<string, unknown>
    if (typeof s.title !== 'string') return null
    if (!Array.isArray(s.entries)) return null

    for (const entry of s.entries) {
      if (!entry || typeof entry !== 'object') return null
      const e = entry as Record<string, unknown>
      if (typeof e.title !== 'string') return null
      if (typeof e.subtitle !== 'string') return null
      if (typeof e.location !== 'string') return null
      if (typeof e.dateRange !== 'string') return null
      if (
        !Array.isArray(e.bullets) ||
        !e.bullets.every((b: unknown) => typeof b === 'string')
      )
        return null
    }
  }

  return data as Resume
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/tests/types.test.ts`

Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/tests/types.test.ts
git commit -m "feat: add Resume types and validateResume"
```

---

## Task 3: Default Resume Data

**Files:**
- Create: `src/defaultResume.ts`

- [ ] **Step 1: Create `src/defaultResume.ts`**

```ts
import type { Resume } from './types'

export const DEFAULT_RESUME: Resume = {
  name: 'Jake Ryan',
  contact: [
    '123-456-7890',
    'jake@example.com',
    'linkedin.com/in/jake',
    'github.com/jake',
  ],
  sections: [
    {
      title: 'Education',
      entries: [
        {
          title: 'Bachelor of Arts in Computer Science, GPA: 3.8',
          subtitle: 'Southwestern University',
          location: 'Georgetown, TX',
          dateRange: 'Aug. 2018 – May 2022',
          bullets: [],
        },
        {
          title: 'Associate Diploma in Liberal Arts',
          subtitle: 'Blinn College',
          location: 'Bryan, TX',
          dateRange: 'Aug. 2016 – May 2018',
          bullets: [],
        },
      ],
    },
    {
      title: 'Experience',
      entries: [
        {
          title: 'Undergraduate Research Assistant',
          subtitle: 'Texas A&M University',
          location: 'College Station, TX',
          dateRange: 'June 2020 – Present',
          bullets: [
            'Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems',
            'Explored methods to generate audio and visual output from stored data',
            'Wrote Python scripts to automatically update and clean databases',
          ],
        },
        {
          title: 'Information Technology Support Specialist',
          subtitle: 'Southwestern University',
          location: 'Georgetown, TX',
          dateRange: 'Sep. 2018 – Present',
          bullets: [
            'Communicate with managers to set up campus computers used on campus',
            'Assessed and stocked inventory of computers, laptops, and other department property',
            'Guided students, faculty, and staff through IT support processes',
          ],
        },
      ],
    },
    {
      title: 'Projects',
      entries: [
        {
          title: 'Gitlytics',
          subtitle: 'Python, Flask, React, PostgreSQL, AWS',
          location: '',
          dateRange: 'June 2020 – Present',
          bullets: [
            'Developed a full-stack web application using Flask serving a REST API with React as the frontend',
            'Implemented GitHub OAuth to get data from user repositories',
            'Visualized GitHub data to show collaboration insights',
            'Used Celery and Redis for asynchronous tasks',
          ],
        },
        {
          title: 'Simple Resume',
          subtitle: 'Rust, Actix-Web, JavaScript',
          location: '',
          dateRange: 'June 2019 – Present',
          bullets: [
            'Developed a concurrent backend in Rust using Actix-Web framework and RESTful API design',
            'Implemented a CRUD application for PDF uploading and parsing',
            'Collaborated with Elsevier to visualize, further analyze, and present data',
          ],
        },
      ],
    },
    {
      title: 'Technical Skills',
      entries: [
        {
          title: '',
          subtitle: '',
          location: '',
          dateRange: '',
          bullets: [
            'Languages: Java, Python, C/C++, SQL, JavaScript, HTML/CSS, R',
            'Frameworks: React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI',
            'Developer Tools: Git, Docker, TravisCI, Google Cloud Platform, VS Code, PyCharm, IntelliJ',
            'Libraries: pandas, NumPy, Matplotlib',
          ],
        },
      ],
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/defaultResume.ts
git commit -m "feat: add Jake's Resume as default template"
```

---

## Task 4: Storage Helpers

**Files:**
- Create: `src/storage.ts`
- Create: `src/tests/storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/tests/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadResume, saveResume, loadConstraints, saveConstraints } from '../storage'
import type { Resume, Constraints } from '../types'

const RESUME_KEY = 'presume:resume'
const CONSTRAINTS_KEY = 'presume:constraints'

const mockResume: Resume = {
  name: 'Test User',
  contact: ['test@example.com'],
  sections: [],
}

const mockConstraints: Constraints = {
  maxPages: 2,
  maxLinesPerBullet: 2,
  minFontSize: 9,
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('saveResume / loadResume', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadResume()).toBeNull()
  })

  it('round-trips a resume through localStorage', () => {
    saveResume(mockResume)
    expect(loadResume()).toEqual(mockResume)
  })

  it('returns null when stored data is invalid JSON', () => {
    localStorage.setItem(RESUME_KEY, '{invalid json')
    expect(loadResume()).toBeNull()
  })

  it('returns null when stored data fails validation', () => {
    localStorage.setItem(RESUME_KEY, JSON.stringify({ badField: true }))
    expect(loadResume()).toBeNull()
  })
})

describe('saveConstraints / loadConstraints', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadConstraints()).toBeNull()
  })

  it('round-trips constraints through localStorage', () => {
    saveConstraints(mockConstraints)
    expect(loadConstraints()).toEqual(mockConstraints)
  })

  it('returns null when stored constraints are invalid JSON', () => {
    localStorage.setItem(CONSTRAINTS_KEY, '{invalid json')
    expect(loadConstraints()).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/tests/storage.test.ts`

Expected: FAIL — `loadResume` is not defined.

- [ ] **Step 3: Create `src/storage.ts`**

```ts
import type { Constraints, Resume } from './types'
import { validateResume } from './types'

const RESUME_KEY = 'presume:resume'
const CONSTRAINTS_KEY = 'presume:constraints'

export function saveResume(resume: Resume): void {
  localStorage.setItem(RESUME_KEY, JSON.stringify(resume))
}

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (!raw) return null
    return validateResume(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveConstraints(constraints: Constraints): void {
  localStorage.setItem(CONSTRAINTS_KEY, JSON.stringify(constraints))
}

export function loadConstraints(): Constraints | null {
  try {
    const raw = localStorage.getItem(CONSTRAINTS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof data.maxPages !== 'number' ||
      typeof data.maxLinesPerBullet !== 'number' ||
      typeof data.minFontSize !== 'number'
    )
      return null
    return data as Constraints
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/tests/storage.test.ts`

Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/storage.ts src/tests/storage.test.ts
git commit -m "feat: add localStorage helpers for resume and constraints"
```

---

## Task 5: useResume Hook

**Files:**
- Create: `src/useResume.ts`

- [ ] **Step 1: Create `src/useResume.ts`**

```ts
import { useState, useEffect } from 'react'
import type { Constraints, Resume } from './types'
import { DEFAULT_CONSTRAINTS } from './types'
import { loadConstraints, loadResume, saveConstraints, saveResume } from './storage'
import { DEFAULT_RESUME } from './defaultResume'

export function useResume() {
  const [resume, setResume] = useState<Resume>(() => loadResume() ?? DEFAULT_RESUME)
  const [constraints, setConstraints] = useState<Constraints>(
    () => loadConstraints() ?? DEFAULT_CONSTRAINTS
  )

  useEffect(() => {
    saveResume(resume)
  }, [resume])

  useEffect(() => {
    saveConstraints(constraints)
  }, [constraints])

  return { resume, setResume, constraints, setConstraints }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/useResume.ts
git commit -m "feat: add useResume hook with autosave"
```

---

## Task 6: CSS Styles

**Files:**
- Create: `src/styles/resume.css`
- Create: `src/styles/app.css`

- [ ] **Step 1: Create `src/styles/resume.css`**

```css
/* ── CSS Custom Properties ─────────────────────────────────────── */
:root {
  --font-size-name: 24px;
  --font-size-contact: 10px;
  --font-size-section: 11px;
  --font-size-entry-title: 11px;
  --font-size-entry-subtitle: 10px;
  --font-size-bullet: 10px;
  --global-scale: 1;

  --page-width: 816px;
  --page-height: 1056px;
  --page-margin-x: 48px;
  --page-margin-y: 48px;
  --bullet-indent: 16px;
}

/* ── Page Container ─────────────────────────────────────────────── */
.resume-page {
  width: var(--page-width);
  min-height: var(--page-height);
  padding: var(--page-margin-y) var(--page-margin-x);
  box-sizing: border-box;
  background: white;
  font-family: 'EB Garamond', Georgia, serif;
  position: relative;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
  overflow: visible;
}

/* ── Header ─────────────────────────────────────────────────────── */
.resume-name {
  font-size: calc(var(--font-size-name) * var(--global-scale));
  text-align: center;
  font-weight: bold;
  line-height: 1.2;
  margin: 0 0 4px;
  display: block;
  width: 100%;
}

.resume-contact {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0 12px;
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
}

.resume-contact-item {
  font-size: calc(var(--font-size-contact) * var(--global-scale));
}

/* ── Section ─────────────────────────────────────────────────────── */
.resume-section {
  margin-top: 6px;
}

.resume-section-header-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.resume-section-title {
  font-size: calc(var(--font-size-section) * var(--global-scale));
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: bold;
  border-bottom: 1px solid #000;
  flex: 1;
  margin: 0 0 3px;
  padding: 0;
}

/* ── Entry ───────────────────────────────────────────────────────── */
.resume-entry {
  margin-top: 4px;
}

.entry-header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.entry-title {
  font-size: calc(var(--font-size-entry-title) * var(--global-scale));
  font-weight: bold;
}

.entry-date {
  font-size: calc(var(--font-size-entry-title) * var(--global-scale));
  font-style: italic;
}

.entry-subtitle-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.entry-subtitle {
  font-size: calc(var(--font-size-entry-subtitle) * var(--global-scale));
  font-style: italic;
}

.entry-location {
  font-size: calc(var(--font-size-entry-subtitle) * var(--global-scale));
  font-style: italic;
}

/* ── Bullets ─────────────────────────────────────────────────────── */
.bullet-list {
  list-style: disc;
  padding-left: var(--bullet-indent);
  margin: 2px 0;
}

.bullet-item {
  line-height: 1.3;
  overflow: visible;
}

.bullet-item--warning {
  background-color: rgba(255, 80, 80, 0.12);
  outline: 1px solid rgba(255, 80, 80, 0.5);
  border-radius: 2px;
}

/* ── Contenteditable focus ring ──────────────────────────────────── */
[contenteditable]:focus {
  outline: 1.5px solid rgba(59, 130, 246, 0.6);
  outline-offset: 1px;
  border-radius: 2px;
}

[contenteditable]:empty:before {
  content: attr(data-placeholder);
  color: #aaa;
  pointer-events: none;
}
```

- [ ] **Step 2: Create `src/styles/app.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #e5e7eb;
  font-family: system-ui, -apple-system, sans-serif;
}

/* ── App Shell ───────────────────────────────────────────────────── */
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 48px;
  gap: 16px;
  min-height: 100vh;
}

/* ── Toolbar ─────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 816px;
}

.toolbar-btn {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s;
}

.toolbar-btn:hover {
  background: #f3f4f6;
}

.toolbar-btn--danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

/* ── Settings Panel ──────────────────────────────────────────────── */
.settings-panel {
  width: 816px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.settings-panel__toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.settings-panel__toggle:hover {
  background: #f9fafb;
}

.settings-panel__body {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-field label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.settings-field input[type='number'] {
  width: 72px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
}

/* ── Add / Remove controls ───────────────────────────────────────── */
.add-btn,
.remove-btn {
  opacity: 0;
  transition: opacity 0.15s;
  padding: 1px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.4;
  color: #6b7280;
  white-space: nowrap;
}

.resume-section:hover .remove-btn,
.resume-entry:hover .remove-btn,
.bullet-item:hover .remove-btn,
.resume-section:hover .add-btn,
.resume-entry:hover .add-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.add-btn:hover {
  background: #f0fdf4;
  border-color: #86efac;
  color: #16a34a;
}

.controls-row {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/resume.css src/styles/app.css
git commit -m "feat: add resume and app CSS with CSS custom properties"
```

---

## Task 7: EditableText Component

**Files:**
- Create: `src/components/EditableText.tsx`

This component wraps `contenteditable` with stable cursor behavior: it only updates the DOM content when an external change happens (import/reset) and the element isn't focused.

- [ ] **Step 1: Create `src/components/EditableText.tsx`**

```tsx
import { useEffect, useRef } from 'react'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  'data-testid'?: string
}

export function EditableText({
  value,
  onChange,
  className,
  style,
  placeholder,
  'data-testid': testId,
}: EditableTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const focused = useRef(false)

  // Sync external value changes into DOM (e.g. import/reset),
  // but never while the user is actively typing.
  useEffect(() => {
    if (ref.current && !focused.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  // Set initial content on mount.
  useEffect(() => {
    if (ref.current) ref.current.textContent = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span
      ref={ref}
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      data-testid={testId}
      onFocus={() => {
        focused.current = true
      }}
      onBlur={e => {
        focused.current = false
        onChange(e.currentTarget.textContent ?? '')
      }}
      onInput={e => {
        onChange((e.currentTarget as HTMLSpanElement).textContent ?? '')
      }}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EditableText.tsx
git commit -m "feat: add EditableText contenteditable component"
```

---

## Task 8: ResumeHeader Component

**Files:**
- Create: `src/components/ResumeHeader.tsx`

- [ ] **Step 1: Create `src/components/ResumeHeader.tsx`**

```tsx
import { EditableText } from './EditableText'
import type { Resume } from '../types'

interface ResumeHeaderProps {
  name: Resume['name']
  contact: Resume['contact']
  onNameChange: (name: string) => void
  onContactChange: (contact: string[]) => void
}

export function ResumeHeader({
  name,
  contact,
  onNameChange,
  onContactChange,
}: ResumeHeaderProps) {
  const updateContact = (index: number, value: string) => {
    const updated = [...contact]
    updated[index] = value
    onContactChange(updated)
  }

  const addContact = () => {
    onContactChange([...contact, 'contact@example.com'])
  }

  const removeContact = (index: number) => {
    onContactChange(contact.filter((_, i) => i !== index))
  }

  return (
    <header className="resume-header">
      <EditableText
        value={name}
        onChange={onNameChange}
        className="resume-name"
        placeholder="Your Name"
      />
      <ul className="resume-contact">
        {contact.map((item, i) => (
          <li key={i} className="resume-contact-item">
            <EditableText
              value={item}
              onChange={v => updateContact(i, v)}
              placeholder="contact"
            />
            <button
              className="remove-btn"
              onClick={() => removeContact(i)}
              aria-label="Remove contact item"
            >
              −
            </button>
          </li>
        ))}
        <li>
          <button className="add-btn" onClick={addContact}>
            + contact
          </button>
        </li>
      </ul>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResumeHeader.tsx
git commit -m "feat: add ResumeHeader component"
```

---

## Task 9: Bullet Component

**Files:**
- Create: `src/components/Bullet.tsx`

Each bullet has its own CSS variable `--font-size-bullet-{sectionIdx}-{entryIdx}-{bulletIdx}` applied via inline style. The `useResizeEngine` hook writes to this variable.

- [ ] **Step 1: Create `src/components/Bullet.tsx`**

```tsx
import { EditableText } from './EditableText'

interface BulletProps {
  text: string
  sectionIdx: number
  entryIdx: number
  bulletIdx: number
  warning: boolean
  onChange: (text: string) => void
  onDelete: () => void
}

export function Bullet({
  text,
  sectionIdx,
  entryIdx,
  bulletIdx,
  warning,
  onChange,
  onDelete,
}: BulletProps) {
  const varName = `--font-size-bullet-${sectionIdx}-${entryIdx}-${bulletIdx}`

  return (
    <li
      className={`bullet-item${warning ? ' bullet-item--warning' : ''}`}
      style={{
        fontSize: `calc(var(${varName}, var(--font-size-bullet)) * var(--global-scale))`,
      }}
    >
      <EditableText value={text} onChange={onChange} placeholder="Bullet point" />
      <button className="remove-btn" onClick={onDelete} aria-label="Delete bullet">
        −
      </button>
    </li>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Bullet.tsx
git commit -m "feat: add Bullet component with per-bullet CSS var"
```

---

## Task 10: Entry Component

**Files:**
- Create: `src/components/Entry.tsx`

- [ ] **Step 1: Create `src/components/Entry.tsx`**

```tsx
import { EditableText } from './EditableText'
import { Bullet } from './Bullet'
import type { ResumeEntry } from '../types'
import type { Warnings } from '../useResizeEngine'

interface EntryProps {
  entry: ResumeEntry
  sectionIdx: number
  entryIdx: number
  warnings: Warnings
  onChange: (entry: ResumeEntry) => void
  onRemove: () => void
}

export function Entry({
  entry,
  sectionIdx,
  entryIdx,
  warnings,
  onChange,
  onRemove,
}: EntryProps) {
  const updateBullet = (bulletIdx: number, text: string) => {
    const bullets = [...entry.bullets]
    bullets[bulletIdx] = text
    onChange({ ...entry, bullets })
  }

  const addBullet = () => {
    onChange({ ...entry, bullets: [...entry.bullets, 'New bullet point'] })
  }

  const removeBullet = (bulletIdx: number) => {
    onChange({ ...entry, bullets: entry.bullets.filter((_, i) => i !== bulletIdx) })
  }

  return (
    <div className="resume-entry">
      <div className="entry-header-row">
        <EditableText
          value={entry.title}
          onChange={v => onChange({ ...entry, title: v })}
          className="entry-title"
          placeholder="Job Title / Degree"
        />
        <EditableText
          value={entry.dateRange}
          onChange={v => onChange({ ...entry, dateRange: v })}
          className="entry-date"
          placeholder="Jan 2020 – Present"
        />
      </div>
      <div className="entry-subtitle-row">
        <EditableText
          value={entry.subtitle}
          onChange={v => onChange({ ...entry, subtitle: v })}
          className="entry-subtitle"
          placeholder="Company / Institution"
        />
        <EditableText
          value={entry.location}
          onChange={v => onChange({ ...entry, location: v })}
          className="entry-location"
          placeholder="City, ST"
        />
      </div>
      <ul className="bullet-list">
        {entry.bullets.map((bullet, bIdx) => (
          <Bullet
            key={bIdx}
            text={bullet}
            sectionIdx={sectionIdx}
            entryIdx={entryIdx}
            bulletIdx={bIdx}
            warning={warnings.get(`bullet-${sectionIdx}-${entryIdx}-${bIdx}`) ?? false}
            onChange={v => updateBullet(bIdx, v)}
            onDelete={() => removeBullet(bIdx)}
          />
        ))}
      </ul>
      <div className="controls-row">
        <button className="add-btn" onClick={addBullet}>
          + bullet
        </button>
        <button className="remove-btn" onClick={onRemove}>
          − entry
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Entry.tsx
git commit -m "feat: add Entry component"
```

---

## Task 11: Section Component

**Files:**
- Create: `src/components/Section.tsx`

- [ ] **Step 1: Create `src/components/Section.tsx`**

```tsx
import { EditableText } from './EditableText'
import { Entry } from './Entry'
import type { ResumeSection, ResumeEntry } from '../types'
import type { Warnings } from '../useResizeEngine'

interface SectionProps {
  section: ResumeSection
  sectionIdx: number
  warnings: Warnings
  onChange: (section: ResumeSection) => void
  onRemove: () => void
}

export function Section({
  section,
  sectionIdx,
  warnings,
  onChange,
  onRemove,
}: SectionProps) {
  const updateEntry = (entryIdx: number, entry: ResumeEntry) => {
    const entries = [...section.entries]
    entries[entryIdx] = entry
    onChange({ ...section, entries })
  }

  const addEntry = () => {
    const newEntry: ResumeEntry = {
      title: 'Job Title',
      subtitle: 'Company',
      location: 'City, ST',
      dateRange: 'Jan 2020 – Present',
      bullets: [],
    }
    onChange({ ...section, entries: [...section.entries, newEntry] })
  }

  const removeEntry = (entryIdx: number) => {
    onChange({ ...section, entries: section.entries.filter((_, i) => i !== entryIdx) })
  }

  return (
    <section className="resume-section">
      <div className="resume-section-header-row">
        <EditableText
          value={section.title}
          onChange={v => onChange({ ...section, title: v })}
          className="resume-section-title"
          placeholder="SECTION"
        />
        <button className="remove-btn" onClick={onRemove} aria-label="Remove section">
          − section
        </button>
      </div>
      {section.entries.map((entry, eIdx) => (
        <Entry
          key={eIdx}
          entry={entry}
          sectionIdx={sectionIdx}
          entryIdx={eIdx}
          warnings={warnings}
          onChange={e => updateEntry(eIdx, e)}
          onRemove={() => removeEntry(eIdx)}
        />
      ))}
      <div className="controls-row">
        <button className="add-btn" onClick={addEntry}>
          + entry
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Section.tsx
git commit -m "feat: add Section component"
```

---

## Task 12: ResumePage Component

**Files:**
- Create: `src/components/ResumePage.tsx`

`ResumePage` is a `forwardRef` component so `App` can pass the DOM ref to `useResizeEngine` for height measurement and to `export.ts` for PDF capture.

- [ ] **Step 1: Create `src/components/ResumePage.tsx`**

```tsx
import { forwardRef } from 'react'
import type { Resume, ResumeSection } from '../types'
import type { Warnings } from '../useResizeEngine'
import { ResumeHeader } from './ResumeHeader'
import { Section } from './Section'

interface ResumePageProps {
  resume: Resume
  onResumeChange: (resume: Resume) => void
  warnings: Warnings
}

export const ResumePage = forwardRef<HTMLDivElement, ResumePageProps>(
  ({ resume, onResumeChange, warnings }, ref) => {
    const updateSection = (sectionIdx: number, section: ResumeSection) => {
      const sections = [...resume.sections]
      sections[sectionIdx] = section
      onResumeChange({ ...resume, sections })
    }

    const addSection = () => {
      onResumeChange({
        ...resume,
        sections: [
          ...resume.sections,
          { title: 'New Section', entries: [] },
        ],
      })
    }

    const removeSection = (sectionIdx: number) => {
      onResumeChange({
        ...resume,
        sections: resume.sections.filter((_, i) => i !== sectionIdx),
      })
    }

    return (
      <div ref={ref} className="resume-page">
        <ResumeHeader
          name={resume.name}
          contact={resume.contact}
          onNameChange={name => onResumeChange({ ...resume, name })}
          onContactChange={contact => onResumeChange({ ...resume, contact })}
        />
        {resume.sections.map((section, sIdx) => (
          <Section
            key={sIdx}
            section={section}
            sectionIdx={sIdx}
            warnings={warnings}
            onChange={s => updateSection(sIdx, s)}
            onRemove={() => removeSection(sIdx)}
          />
        ))}
        <div className="controls-row" style={{ marginTop: 8 }}>
          <button className="add-btn" onClick={addSection}>
            + section
          </button>
        </div>
      </div>
    )
  }
)

ResumePage.displayName = 'ResumePage'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResumePage.tsx
git commit -m "feat: add ResumePage forwardRef component"
```

---

## Task 13: useResizeEngine Hook

**Files:**
- Create: `src/useResizeEngine.ts`
- Create: `src/tests/resizeEngine.test.ts`

This is the core of the app. The key pure function is `binarySearchFontSize`, which takes a measurement callback so it can be unit-tested without a real canvas.

**Layout constants:**
- Page width: 816px, margins: 48px each side, bullet indent: 16px
- Column width for bullet text: `816 - 48 - 48 - 16 = 704px`
- Default bullet font: `10px 'EB Garamond'`
- Per-bullet CSS var: `--font-size-bullet-{sectionIdx}-{entryIdx}-{bulletIdx}` stores a value like `"9.5px"`

**Algorithm:**
1. Collect all bullet texts; check fast path (no bullet changed AND last height < 95% of limit)
2. For each bullet: measure line count, binary search font size if needed, set CSS var
3. Read page height from DOM; binary search `--global-scale` to fit page if needed
4. Collect warnings for bullets and global overflow

- [ ] **Step 1: Write failing tests**

Create `src/tests/resizeEngine.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { binarySearchFontSize } from '../useResizeEngine'

describe('binarySearchFontSize', () => {
  it('returns hi when measureLines always returns 1 (fits at max size)', () => {
    const result = binarySearchFontSize(
      () => 1,  // always 1 line regardless of size
      8,        // lo (minFontSize)
      10,       // hi (defaultSize)
      1,        // maxLines
      0.5,      // precision
      20        // maxIterations
    )
    // Should converge near hi since measuring always fits
    expect(result).toBeCloseTo(10, 0)
  })

  it('returns lo when measureLines always overflows', () => {
    const result = binarySearchFontSize(
      () => 5,  // always 5 lines, always overflows
      8,
      10,
      1,
      0.5,
      20
    )
    // Nothing fits, so result converges near lo
    expect(result).toBeCloseTo(8, 0)
  })

  it('finds the threshold where fits switches to overflows', () => {
    // Simulate: fits (1 line) at size <= 9, overflows (2 lines) at size > 9
    const measureLines = (fontSize: number) => (fontSize <= 9 ? 1 : 2)
    const result = binarySearchFontSize(measureLines, 8, 10, 1, 0.5, 20)
    // Should converge near 9 (the highest size that fits)
    expect(result).toBeGreaterThanOrEqual(8.5)
    expect(result).toBeLessThanOrEqual(9.5)
  })

  it('respects maxIterations', () => {
    let calls = 0
    binarySearchFontSize(
      () => { calls++; return 2 },
      8, 10, 1, 0.0001, 5  // tiny precision but only 5 iterations
    )
    expect(calls).toBeLessThanOrEqual(5)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/tests/resizeEngine.test.ts`

Expected: FAIL — `binarySearchFontSize` is not exported.

- [ ] **Step 3: Create `src/useResizeEngine.ts`**

```ts
import { useEffect, useRef } from 'react'
import { prepareWithSegments, measureLineStats } from '@chenglou/pretext'
import type { Constraints, Resume } from './types'

// ── Constants ──────────────────────────────────────────────────────
const PAGE_HEIGHT_PX = 1056
const COLUMN_WIDTH = 704  // 816 - 48 - 48 - 16
const DEFAULT_BULLET_SIZE = 10  // px, must match --font-size-bullet in CSS
const RESUME_FONT = 'EB Garamond'

// ── Public types ───────────────────────────────────────────────────
export type Warnings = Map<string, boolean>

// ── Pure helpers (exported for testing) ───────────────────────────

/**
 * Binary search for the highest font size (in [lo, hi]) where
 * measureLines(fontSize) <= maxLines.
 *
 * @param measureLines - callback that returns the line count for a given font size
 * @param lo           - minimum font size (lower bound, inclusive)
 * @param hi           - starting maximum font size (upper bound, inclusive)
 * @param maxLines     - constraint: line count must be <= this
 * @param precision    - stop when hi - lo < precision
 * @param maxIterations - safety cap on iterations
 * @returns the highest fontSize in [lo, hi] that satisfies the constraint,
 *          or lo if nothing satisfies it
 */
export function binarySearchFontSize(
  measureLines: (fontSize: number) => number,
  lo: number,
  hi: number,
  maxLines: number,
  precision: number,
  maxIterations: number
): number {
  let low = lo
  let high = hi

  for (let i = 0; i < maxIterations; i++) {
    if (high - low < precision) break
    const mid = (low + high) / 2
    const lineCount = measureLines(mid)
    if (lineCount <= maxLines) {
      low = mid   // mid fits — can try higher
    } else {
      high = mid  // mid overflows — try lower
    }
  }

  return low
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Runs the Pretext-based resize engine after every resume/constraints change.
 * Writes CSS custom properties to document.documentElement and returns
 * a Warnings map keyed by "bullet-{s}-{e}-{b}" or "global-overflow".
 */
export function useResizeEngine(
  resume: Resume,
  constraints: Constraints,
  pageRef: React.RefObject<HTMLElement | null>
): Warnings {
  const warningsRef = useRef<Warnings>(new Map())
  const prevBulletTexts = useRef<string[]>([])
  const prevHeight = useRef<number>(0)

  useEffect(() => {
    const run = async () => {
      // Wait for fonts to load so Pretext measurements are accurate.
      await document.fonts.ready

      const { maxPages, maxLinesPerBullet, minFontSize } = constraints
      const pageHeightLimit = maxPages * PAGE_HEIGHT_PX
      const root = document.documentElement

      // ── Collect bullet texts ────────────────────────────────────
      const bulletTexts: string[] = []
      resume.sections.forEach(section =>
        section.entries.forEach(entry =>
          entry.bullets.forEach(bullet => bulletTexts.push(bullet))
        )
      )

      // ── Fast path ───────────────────────────────────────────────
      const bulletTextsUnchanged =
        bulletTexts.length === prevBulletTexts.current.length &&
        bulletTexts.every((t, i) => t === prevBulletTexts.current[i])
      const wellWithinLimit = prevHeight.current < pageHeightLimit * 0.95

      if (bulletTextsUnchanged && wellWithinLimit) return

      prevBulletTexts.current = bulletTexts
      const newWarnings = new Map<string, boolean>()

      // ── Per-bullet resize ────────────────────────────────────────
      resume.sections.forEach((section, sIdx) => {
        section.entries.forEach((entry, eIdx) => {
          entry.bullets.forEach((bulletText, bIdx) => {
            const varName = `--font-size-bullet-${sIdx}-${eIdx}-${bIdx}`
            const currentSizeStr = root.style.getPropertyValue(varName)
            // Parse "9.5px" → 9.5, or fall back to default
            const currentSize = currentSizeStr
              ? parseFloat(currentSizeStr)
              : DEFAULT_BULLET_SIZE

            const measureLines = (fontSize: number) => {
              const font = `${fontSize}px '${RESUME_FONT}'`
              const prepared = prepareWithSegments(bulletText, font)
              return measureLineStats(prepared, COLUMN_WIDTH).lineCount
            }

            const lineCount = measureLines(currentSize)
            let newSize = currentSize

            if (lineCount > maxLinesPerBullet) {
              // Shrink to fit
              newSize = binarySearchFontSize(
                measureLines,
                minFontSize,
                currentSize,
                maxLinesPerBullet,
                0.5,
                20
              )
              // Verify at minFontSize
              if (measureLines(minFontSize) > maxLinesPerBullet) {
                newWarnings.set(`bullet-${sIdx}-${eIdx}-${bIdx}`, true)
                newSize = minFontSize
              }
            } else if (lineCount < maxLinesPerBullet && currentSize < DEFAULT_BULLET_SIZE) {
              // Recover toward default
              newSize = binarySearchFontSize(
                measureLines,
                currentSize,
                DEFAULT_BULLET_SIZE,
                maxLinesPerBullet,
                0.5,
                20
              )
            }

            root.style.setProperty(varName, `${newSize}px`)
          })
        })
      })

      // ── Page overflow resize ────────────────────────────────────
      if (!pageRef.current) return

      const currentHeight = pageRef.current.getBoundingClientRect().height
      prevHeight.current = currentHeight

      const currentScaleStr = root.style.getPropertyValue('--global-scale')
      const currentScale = currentScaleStr ? parseFloat(currentScaleStr) : 1.0

      if (currentHeight > pageHeightLimit) {
        // Smallest base font role is 10px (contact/bullet), so min scale keeps it at minFontSize
        const minScale = minFontSize / 10

        const measureHeightAtScale = (scale: number): number => {
          root.style.setProperty('--global-scale', `${scale}`)
          return pageRef.current!.getBoundingClientRect().height
        }

        const fitScale = binarySearchFontSize(
          scale => (measureHeightAtScale(scale) <= pageHeightLimit ? 1 : 2),
          minScale,
          currentScale,
          1,  // "fits" means lineCount-equivalent <= 1 (height fits)
          0.001,
          20
        )

        root.style.setProperty('--global-scale', `${fitScale}`)

        // Check if still overflows at minScale
        const finalHeight = pageRef.current.getBoundingClientRect().height
        if (finalHeight > pageHeightLimit) {
          newWarnings.set('global-overflow', true)
        }
      } else if (currentHeight <= pageHeightLimit && currentScale < 1.0) {
        // Try to recover scale toward 1.0
        const measureHeightAtScale = (scale: number): number => {
          root.style.setProperty('--global-scale', `${scale}`)
          return pageRef.current!.getBoundingClientRect().height
        }

        const recoveredScale = binarySearchFontSize(
          scale => (measureHeightAtScale(scale) <= pageHeightLimit ? 1 : 2),
          currentScale,
          1.0,
          1,
          0.001,
          20
        )

        root.style.setProperty('--global-scale', `${recoveredScale}`)
      }

      warningsRef.current = newWarnings
    }

    run().catch(console.error)
  }, [resume, constraints, pageRef])

  return warningsRef.current
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/tests/resizeEngine.test.ts`

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/useResizeEngine.ts src/tests/resizeEngine.test.ts
git commit -m "feat: add useResizeEngine hook with Pretext-based resize algorithm"
```

---

## Task 14: SettingsPanel Component

**Files:**
- Create: `src/components/SettingsPanel.tsx`

- [ ] **Step 1: Create `src/components/SettingsPanel.tsx`**

```tsx
import { useState } from 'react'
import type { Constraints } from '../types'

interface SettingsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
}

export function SettingsPanel({ constraints, onChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)

  const update = (key: keyof Constraints, value: number) => {
    onChange({ ...constraints, [key]: value })
  }

  return (
    <div className="settings-panel">
      <button
        className="settings-panel__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>⚙ Constraints</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="settings-panel__body">
          <div className="settings-field">
            <label htmlFor="max-pages">Max pages</label>
            <input
              id="max-pages"
              type="number"
              min={1}
              max={10}
              value={constraints.maxPages}
              onChange={e => update('maxPages', Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="settings-field">
            <label htmlFor="max-lines">Max lines per bullet</label>
            <input
              id="max-lines"
              type="number"
              min={1}
              max={10}
              value={constraints.maxLinesPerBullet}
              onChange={e =>
                update('maxLinesPerBullet', Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </div>
          <div className="settings-field">
            <label htmlFor="min-font">Min font size (px)</label>
            <input
              id="min-font"
              type="number"
              min={4}
              max={16}
              value={constraints.minFontSize}
              onChange={e =>
                update('minFontSize', Math.max(4, parseInt(e.target.value) || 8))
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SettingsPanel.tsx
git commit -m "feat: add SettingsPanel component"
```

---

## Task 15: Export Utilities

**Files:**
- Create: `src/export.ts`

- [ ] **Step 1: Create `src/export.ts`**

```ts
import type { Resume } from './types'
import { validateResume } from './types'

const PAGE_WIDTH_IN = 8.5
const PAGE_HEIGHT_IN = 11

/**
 * Captures the ResumePage DOM element as a canvas and saves it as a PDF.
 * Temporarily sets fixed dimensions and clips for clean capture.
 */
export async function exportPDF(pageElement: HTMLElement): Promise<void> {
  // Dynamic imports to avoid bloating the initial bundle.
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  // Temporarily constrain the element to exactly one page for capture.
  const prevOverflow = pageElement.style.overflow
  const prevHeight = pageElement.style.height
  pageElement.style.overflow = 'hidden'
  pageElement.style.height = `${pageElement.scrollHeight}px`

  const canvas = await html2canvas(pageElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  pageElement.style.overflow = prevOverflow
  pageElement.style.height = prevHeight

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  })

  pdf.addImage(imgData, 'PNG', 0, 0, PAGE_WIDTH_IN, PAGE_HEIGHT_IN)
  pdf.save('resume.pdf')
}

/**
 * Serializes the resume to JSON and triggers a browser file download.
 */
export function exportJSON(resume: Resume): void {
  const json = JSON.stringify(resume, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'resume.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Reads a .json file, parses it, and validates it as a Resume.
 * Rejects with a human-readable error message if the file is invalid.
 */
export function importJSON(file: File): Promise<Resume> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data: unknown = JSON.parse(e.target?.result as string)
        const resume = validateResume(data)
        if (!resume) {
          reject(new Error('File does not match the expected resume format.'))
          return
        }
        resolve(resume)
      } catch {
        reject(new Error('Could not parse the file as JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read the file.'))
    reader.readAsText(file)
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/export.ts
git commit -m "feat: add PDF and JSON export/import utilities"
```

---

## Task 16: Toolbar Component

**Files:**
- Create: `src/components/Toolbar.tsx`

- [ ] **Step 1: Create `src/components/Toolbar.tsx`**

```tsx
import { useRef } from 'react'
import type { Resume } from '../types'
import { exportJSON, exportPDF, importJSON } from '../export'

interface ToolbarProps {
  resume: Resume
  pageRef: React.RefObject<HTMLElement | null>
  onImport: (resume: Resume) => void
  onReset: () => void
}

export function Toolbar({ resume, pageRef, onImport, onReset }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportPDF = async () => {
    if (!pageRef.current) return
    try {
      await exportPDF(pageRef.current)
    } catch (err) {
      alert(`PDF export failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleExportJSON = () => {
    exportJSON(resume)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(
      'Importing will replace your current resume. Continue?'
    )
    if (!confirmed) {
      e.target.value = ''
      return
    }

    try {
      const imported = await importJSON(file)
      onImport(imported)
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      e.target.value = ''
    }
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      'Reset to the default Jake\'s Resume template? This will clear your current resume.'
    )
    if (confirmed) onReset()
  }

  return (
    <div className="toolbar">
      <button className="toolbar-btn" onClick={handleExportPDF}>
        Export PDF
      </button>
      <button className="toolbar-btn" onClick={handleExportJSON}>
        Export JSON
      </button>
      <button className="toolbar-btn" onClick={handleImportClick}>
        Import JSON
      </button>
      <button className="toolbar-btn toolbar-btn--danger" onClick={handleReset}>
        Reset to Template
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: add Toolbar component with export/import/reset"
```

---

## Task 17: App.tsx — Wire Everything Together

**Files:**
- Create: `src/App.tsx`

- [ ] **Step 1: Create `src/App.tsx`**

```tsx
import { useRef } from 'react'
import { useResume } from './useResume'
import { useResizeEngine } from './useResizeEngine'
import { DEFAULT_RESUME } from './defaultResume'
import { SettingsPanel } from './components/SettingsPanel'
import { Toolbar } from './components/Toolbar'
import { ResumePage } from './components/ResumePage'
import './styles/app.css'
import './styles/resume.css'

export default function App() {
  const { resume, setResume, constraints, setConstraints } = useResume()
  const pageRef = useRef<HTMLDivElement>(null)
  const warnings = useResizeEngine(resume, constraints, pageRef)

  return (
    <div className="app">
      <SettingsPanel constraints={constraints} onChange={setConstraints} />
      <Toolbar
        resume={resume}
        pageRef={pageRef}
        onImport={setResume}
        onReset={() => setResume(DEFAULT_RESUME)}
      />
      <ResumePage
        ref={pageRef}
        resume={resume}
        onResumeChange={setResume}
        warnings={warnings}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run the dev server and verify the app loads**

Run: `npm run dev`

Expected: Vite dev server starts. Open `http://localhost:5173/presume/` in a browser. Jake's Resume should render. Clicking any text should make it editable. Console should show no errors.

- [ ] **Step 3: Run all tests**

Run: `npm test`

Expected: All tests pass (types, storage, resizeEngine).

- [ ] **Step 4: Build the project**

Run: `npm run build`

Expected: `dist/` directory created with no TypeScript or build errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire App with useResume, useResizeEngine, and all components"
```

---

## Task 18: GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Build
        run: npm run build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages in the repo settings**

Go to: https://github.com/nikolaisalazar/presume/settings/pages

Set:
- **Source:** GitHub Actions

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Pages deployment workflow"
git push origin main
```

Expected: GitHub Actions workflow runs, deploys to `https://nikolaisalazar.github.io/presume/`.

- [ ] **Step 4: Verify the deployment**

Open: `https://nikolaisalazar.github.io/presume/`

Expected: The app loads with Jake's Resume visible and editable.

---

## Self-Review Checklist

After writing this plan, here is a self-review against the spec:

**Spec coverage:**
- ✅ WYSIWYG editing via `contenteditable` (EditableText, all components)
- ✅ Sections/entries add/remove via +/− controls (Section, Entry, ResumePage)
- ✅ SettingsPanel with max pages, max lines, min font size (Task 14)
- ✅ Warnings on overflowing bullets and global overflow (useResizeEngine `newWarnings`)
- ✅ localStorage autosave (useResume, storage.ts)
- ✅ First visit pre-populated with Jake's Resume (useResume init via `?? DEFAULT_RESUME`)
- ✅ PDF export (export.ts → html2canvas + jsPDF)
- ✅ JSON export/import (export.ts, Toolbar)
- ✅ Per-bullet CSS variable sizing (Bullet, useResizeEngine)
- ✅ Global scale factor via `calc()` not `transform` (resume.css, useResizeEngine)
- ✅ Binary search precision 0.5px, max 20 iterations (binarySearchFontSize)
- ✅ Fast path check (useResizeEngine fast path)
- ✅ Page dimensions 816×1056px (resume.css, useResizeEngine constants)
- ✅ Column width 704px (useResizeEngine `COLUMN_WIDTH`)
- ✅ GitHub Pages deployment (Task 18)
- ✅ TDD for validateResume, storage, binarySearchFontSize

**Type consistency check:**
- `Warnings` type is `Map<string, boolean>` — defined once in `useResizeEngine.ts`, imported by Entry and Section
- `ResumeSection` / `ResumeEntry` — named with `Resume` prefix to avoid clash with `<section>` / `<entry>` HTML semantics; all component props use these names consistently
- `binarySearchFontSize` signature is the same in both its definition (Task 13) and test (Task 13 Step 1)
- `pageRef` is `React.RefObject<HTMLElement | null>` in `useResizeEngine` and `React.RefObject<HTMLDivElement>` in App — `HTMLDivElement` extends `HTMLElement`, compatible ✓

**No placeholders found.** All steps contain actual code.
