# Phase B.2 Execution Plan: Frontend Architecture & Resume Workstation

**Target:** Refactor the JobLume AI frontend to deliver the three-tier Master Profile / Resume View / Version workstation powered by the live `/api/v2/*` backend APIs.
**Author:** AI Technical Specialist & Pair Programmer
**Status:** DRAFT v1.1 — Incorporating Plan Review Clarifications (Session 30)
**Document Version:** 1.1
**Associated Milestone:** Phase B.2 (Frontend Only)

---

## Revision Log

| Version | Date | Author | Summary of Changes |
| :--- | :--- | :--- | :--- |
| **1.0** | 2026-10-24 | AI Specialist | Initial proposal covering all 10 architectural decisions, templates, inline mechanics, and 3-sub-PR breakdown. |
| **1.1** | 2026-10-24 | AI Specialist | Addressed review feedback from Session 30: (1) Adopted Option B for state management: Context + useReducer for B2.1 & B2.2, deferring Zustand exclusively to B2.3 for autosave/debounce; (2) Mandated `apiV2.ts` reuses existing `api.ts` axios instance for 401 token refresh; (3) Clarified B2.2 manual-save-only boundary vs B2.3 debounced autosave layer; (4) Committed to Strategy A for legacy route resolution (`<ResumeRouteResolver />`); (5) Resolved all 4 open review questions. |

---

## 1. Objective and Scope

### 1.1 Objective
Phase B.1 deployed the foundational backend data hierarchy (canonical Master Profile, tailored Resume Views, immutable Version Snapshots). Phase B.2 delivers the user-facing web application that brings this data hierarchy to life. Users will, for the first time, curate their permanent career record in a dedicated Master Profile and assemble tailored, styled resume views with live multi-page preview and instant historical restore.

### 1.2 In-Scope Deliverables (Phase B.2)
1. **Master Profile Editor (`/dashboard/profile`):**
   - Comprehensive form-based career bank for all 10 canonical sections (`personal_info`, `summary`, `experience`, `education`, `projects`, `skills`, `certifications`, `languages`, `awards`, `custom_sections`).
   - Client-side UUID minting matching backend schemas.
   - Skill tag management (`SkillItemSchema = { name, tags }`) and inline bullet tagging (`BulletItemSchema = { id, text, tags }`).
2. **Resume View Workstation (`/dashboard/resumes/:id`):**
   - High-performance split workstation: left configuration panel + right live paper preview.
   - Entry selection checkboxes (filtering master entries into specific tailored views).
   - Section reordering (drag-and-drop with full keyboard accessibility) and section visibility toggles.
   - Styling controls: Template selector, font picker, and dynamic color picker with WCAG contrast guard.
   - **Save Mode Progression:** B2.2 delivers a robust **Manual Save** path. B2.3 layers the **Debounced Autosave Engine** on top.
3. **Template Rendering System:**
   - Standardized React template interface driven by live `resolved_data`.
   - Initial implementation of two core templates: `minimal-ats` (ATS-optimized single column) and `modern-professional` (structured modern layout).
4. **Targeted Inline Editing (Preview Pane - B2.3):**
   - Direct-manipulation inline editing for high-frequency tailored fields (`summary`, `experience` bullet points, and resume title).
   - Keyboard shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+K`) for basic inline formatting.
   - Non-destructive staging into `content_overrides` without altering the canonical Master Profile.
5. **Autosave Engine (B2.3):**
   - 1000ms debounced auto-sync with optimistic state updates, background rollback on error, status indicators (`Saving...`, `Unsaved changes`, `All changes saved`), and offline resilience.
6. **Live Multi-Page Preview & Fit Guidance:**
   - True A4/Letter paper aspect ratio simulation with real-time DOM height measurement.
   - Dynamic page-break boundaries and visual page-fit indicator (e.g., "1.0 Page (Optimal)", "1.2 Pages (Overflow Warning)").
7. **Version History Slide-Over Drawer (B2.3):**
   - Historical snapshot drawer listing versions descending (`v3, v2, v1`) with timestamps and change sources.
   - One-click restore flow featuring automatic pre-restore checkpoint safeguards.
8. **Free Tier Watermark Component:**
   - Preview-only visual overlay (discreet bottom-right diagonal badge, ~30% opacity, semi-transparent) positioned on the paper canvas without contaminating data models.

### 1.3 Out-of-Scope (Deferred to Later Sub-Phases)
- **Backend Mutations:** Zero backend code or database migrations. All `/api/v2/*` endpoints remain frozen.
- **Serverless PDF/DOCX Export Engine (Phase B.3):** Actual file downloads continue using existing legacy export endpoints or remain disabled until B.3 replaces them with the headless Chromium PDF service.
- **Watermark Enforcement & Monetization Gating (Phase B.4):** Stripe/billing integration and hard server-side PDF gating.
- **Floating Formatting Bubble (Phase B.3):** Floating selection tooltip deferred; B.2 relies strictly on keyboard shortcuts.
- **Remaining Template Catalog (Phase B.4):** Additional templates (`creative-portfolio`, `executive-brief`, etc.) will be added in B.4 once the core engine is proven.
- **AI Tailoring UI (Phase C):** Job description matching and automated bullet rewriting modals.
- **Mobile Native Optimization:** Responsive layout with desktop-first productivity focus (>1024px viewport optimal).

---

## 2. Coexistence Strategy

### 2.1 The Coexistence Challenge
Currently, users interact with the legacy `/resume/*` endpoints through `ResumeBuilderPage.tsx` and `MyResumesPage.tsx`. In Phase B.1, both legacy tables and new v2 tables were deployed concurrently. In production, there is currently 1 admin user and 0 active resumes.

### 2.2 Decision: Option A+ (Progressive Direct Transition with Guarded Legacy Fallback)

```mermaid
flowchart TD
    User([User Navigates to Dashboard]) --> DashNav{Route Requested}

    DashNav -->|/dashboard/resumes| V2List[V2 Resume Library<br/>Calls /api/v2/resumes]
    DashNav -->|/dashboard/profile| MasterEditor[Master Profile Editor<br/>Calls /api/v2/profile]
    DashNav -->|/dashboard/resumes/edit/:id| Resolver[<ResumeRouteResolver /><br/>Calls GET /api/v2/resumes/:id]

    Resolver -->|HTTP 200| V2Editor[New Resume Workstation<br/>/dashboard/resumes/:id]
    Resolver -->|HTTP 404| LegacyEditor[Legacy ResumeBuilderPage<br/>Calls GET /resume/:id]

    V2List -->|Click 'New Resume'| CreateV2[POST /api/v2/resumes<br/>Auto-links Master Profile]
    CreateV2 --> V2Editor
```

### 2.3 Legacy Route Resolution Mechanism (Implementation A)
To prevent broken bookmarks or external links while cleanly defaulting all traffic to the v2 platform:
1. **Dynamic Route Inspector (`<ResumeRouteResolver />`):**
   The route `/dashboard/resumes/edit/:id` mounts a lightweight resolver component. Upon mounting with `:id`:
   - It issues a non-blocking `GET /api/v2/resumes/{id}` call.
   - **If HTTP 200 (Found in v2):** It redirects cleanly to `/dashboard/resumes/{id}` and mounts `ResumeViewEditorPage.tsx`.
   - **If HTTP 404 (Legacy ID):** It falls back seamlessly to the legacy `ResumeBuilderPage.tsx` (which calls `GET /resume/{id}`).
   - Cost: A single, fast (~50ms) API check only on direct legacy URL hits.
2. **Dedicated Fallback Path:**
   The legacy builder page is also permanently addressable at `/dashboard/resumes/legacy/edit/:id` for explicit debugging and administrative fallback.
3. **Primary Entry Point:**
   `/dashboard/resumes` lists exclusively v2 Resume Views (`GET /api/v2/resumes`). The "New Resume" button dispatches `POST /api/v2/resumes` and navigates directly to `/dashboard/resumes/:id`.

---

## 3. Editor Architecture

### 3.1 State Management: Context vs. Zustand Progression (Option B)

To avoid introducing premature dependencies while guaranteeing 60fps rendering during high-speed typing, state management progresses deliberately across sub-PRs:

1. **Sub-PR B2.1 (Master Profile Editor): React Context + `useReducer`**
   The Master Profile is a structured, form-based career bank. Section updates (saving experience, adding an education block, toggling a skill tag) are discrete, form-driven actions. React Context (`MasterProfileContext.tsx`) provides straightforward state distribution with zero external state libraries.
2. **Sub-PR B2.2 (Resume View Workstation with Manual Save): React Context + `useReducer`**
   In B2.2, configuration changes (entry selection, section order, visibility, template, and primary color) are applied locally and persisted strictly via an explicit **Manual Save** button. Context + `useReducer` (`ResumeEditorContext.tsx`) cleanly encapsulates this state without re-render penalties.
3. **Sub-PR B2.3 (Inline Editing & Autosave Engine): Transition to Zustand**
   Zustand (`useResumeEditorStore.ts`) is introduced exclusively in B2.3 to solve the complex asynchronous challenges of real-time inline editing and background autosave:
   - *(a) Fine-Grained Subscription Performance:* During live inline typing on the paper preview, every keystroke updates state. In React Context, every dispatch forces the entire workstation tree (all left-panel tabs, toolbar, and paper canvas) to re-render, causing perceptible typing lag and caret jumping. Zustand selectors (`useResumeEditorStore(s => s.content_overrides)`) ensure that *only* the specific inline paragraph being edited re-renders.
   - *(b) Optimistic Update Rollback:* Zustand maintains an in-memory `lastSavedState` snapshot. If a debounced background HTTP request fails (network interruption, 5xx), the store rolls back optimistic local changes cleanly without unmounting component trees or losing DOM focus.
   - *(c) Offline Queue & Event Subscriptions:* Zustand allows subscription to `window.addEventListener('online')` and `dirtyFields` tracking outside of the React render lifecycle, preventing stale closures in debounce timers.

### 3.2 Save Path Progression: B2.2 Manual Save vs. B2.3 Autosave

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Sub-PR B2.2: Manual Save Only (Predictable Baseline)                                    │
│ [Title Input]   [History (disabled)]   [Zoom: 100%]   [💾 Save Changes (Manual Click)] │
│ User clicks 'Save Changes' ──► HTTP PUT /api/v2/resumes/:id ──► Toast 'Saved!'         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼ (Layered on top in B2.3)
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Sub-PR B2.3: Debounced Autosave Engine (Zero-Friction Productivity)                     │
│ [Title Input]   [● All changes saved]   [History (3)]   [Zoom: 100%]   [💾 Save]       │
│ Keystroke ──► Optimistic Render ──► 1000ms Debounce ──► Background PUT ──► Commit Sync │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### B2.2 Manual Save Contract:
- The workstation features an explicit, primary **"Save Changes"** button in the toolbar.
- The user modifies entries, reorders sections, or alters themes, then clicks "Save Changes".
- The client dispatches `PUT /api/v2/resumes/{id}` with the full configuration payload.
- Upon 200 OK, a toast confirms: *"Resume view saved successfully."*
- **No debouncing, no dirty timers, no offline queue.** This keeps B2.2 strictly isolated and easily testable.

#### B2.3 Autosave Layer Contract:
- Wraps the existing B2.2 save function in a **1000ms debounce timer**.
- Keystrokes in inline editable fields (`summary`, `bullets`) trigger immediate optimistic local state updates while resetting the 1000ms timer.
- Toolbar displays live status pills:
  - `Saving...` (spinner)
  - `Unsaved changes` (amber dot while user is typing)
  - `All changes saved` (green checkmark after HTTP 200)
  - `Offline — saved locally` (gray cloud when network is offline)
- Conflict Resolution: Multi-tab edits compare `updated_at`. If server returns a newer timestamp, a non-intrusive toast alerts: *"Resume was updated in another tab. [Reload to sync]"*.
- Offline Queue: If offline, changes stage to `sessionStorage` and automatically flush when `window.ononline` fires.
- The manual "Save" button remains present for user reassurance and immediately flushes the debouncer.

### 3.3 Hybrid Layout & Direct-Manipulation Mechanics

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Top Toolbar: Title Input | Autosave Status | Version History Button | Preview Scale | Manual Save Button│
├──────────────────────────────────────────────────┬──────────────────────────────────────────────────────┤
│ Left Panel: Structured Configuration (45%)       │ Right Panel: Live Paper Preview (55%)                │
│ ┌──────────────────────────────────────────────┐ │ ┌──────────────────────────────────────────────────┐ │
│ │ Tabs: [Content & Entries] [Styling] [Layout] │ │ │ [Page Fit: 1.0 Page (Optimal)]    [Zoom: 100%]   │ │
│ ├──────────────────────────────────────────────┤ │ ├──────────────────────────────────────────────────┤ │
│ │ • Section Visibility Toggles (Eye icon)      │ │ │ ┌──────────────────────────────────────────────┐ │ │
│ │ • Entry Checkboxes (Select from Master)      │ │ │ │ Header & Contact (Read-only from Master)     │ │ │
│ │ • Section Reorder (Drag Handle + Up/Down)    │ │ │ │ Summary ([Inline Editable])                  │ │ │
│ │ • Template & Font Dropdowns                  │ │ │ │ Experience Entry                             │ │ │
│ │ • Color Picker + Contrast Guard Pill         │ │ │ │   • Bullet 1 ([Inline Editable Override])    │ │ │
│ │ • Tailored Override Indicator Badges         │ │ │ │   • Bullet 2 ([Inline Editable Override])    │ │ │
│ │                                              │ │ │ │ [--- Page Break Line (Calculated) ---]       │ │ │
│ │                                              │ │ │ └──────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────┘ │ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

#### Scope of Inline Editing in B.2:
- **Prose Fields Only:** Summary paragraph, experience bullet points, and resume title.
- **Structural Fields Form-Managed:** Companies, degrees, dates, institutions, and skill tags remain managed via left-panel forms/modals to prevent cursor instability and date formatting bugs.
- **Keyboard Shortcuts Only:** Basic inline formatting is triggered via keyboard shortcuts: `Ctrl+B` (bold), `Ctrl+I` (italic), `Ctrl+K` (link). Floating formatting bubble tooltips are deferred to Phase B.3.
- **Keyboard Navigation:**
  - `Enter`: Commits current edit and blurs.
  - `Shift + Enter`: Inserts a soft newline within the same bullet.
  - `Escape`: Reverts changes to the pre-focus value and exits edit mode.
- **Override Staging:** Inline edits modify `content_overrides` only. The canonical Master Profile is never mutated from the resume view editor. A purple dot badge indicates tailored content with a one-click "Reset to Master" option.

---

## 4. Template System Architecture

### 4.1 Data-Driven Registry
Templates are decoupled from the workstation container. Each template is declared in `TemplateRegistry.ts`:

```typescript
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: 'ats' | 'modern' | 'creative';
  isAtsSafe: boolean;
  supportsPhoto: boolean;
  thumbnailUrl: string;
  defaultPrimaryColor: string;
  component: React.ComponentType<TemplateComponentProps>;
}

export interface TemplateComponentProps {
  data: ResolvedResumeData;
  primaryColor: string;
  fontFamily: string;
  isEditable?: boolean;
  onEditField?: (path: string, value: string) => void;
}
```

### 4.2 Initial Phase B.2 Templates
1. **`minimal-ats`:**
   - Single-column layout, standard black/gray text with primary color accents on section headers.
   - Clean horizontal divider rules, standard system serif/sans typography, no icons in contact block for 100% ATS parser compatibility.
2. **`modern-professional`:**
   - Asymmetric modern layout: Header with subtle colored background banner or left border accent.
   - Two-column skills/education grid with standard experience timeline. High visual polish for human recruiters.

### 4.3 Shared CSS Design Tokens
All templates consume standardized CSS Custom Properties injected into the preview container root:
```css
.resume-preview-container {
  --resume-primary: #2563EB;
  --resume-font: 'Inter', sans-serif;
  --resume-font-size-base: 10pt;
  --resume-font-size-name: 20pt;
  --resume-font-size-title: 12pt;
  --resume-font-size-heading: 11pt;
  --resume-line-height: 1.4;
  --resume-page-margin: 18mm;
  --resume-accent-contrast: #FFFFFF;
}
```

---

## 5. Version History Slide-Over Drawer (Sub-PR B2.3)

### 5.1 UX & Interaction Flow
1. **Access Point:** Top workstation toolbar includes a button: `History (3)` displaying total snapshot count.
2. **Drawer Presentation:** Sliding in from the right edge (`width: 380px`), overlaying the configuration form while keeping the live paper preview visible.
3. **Version Item Card:**
   - Version number pill (`v3`, `v2`, `v1`).
   - Relative timestamp ("Saved 2 hours ago") + absolute tooltip.
   - Change source badge: `manual` (blue) vs `restore_checkpoint` (amber).
   - Label and optional notes.
   - Action buttons: "Preview" and "Restore".
4. **Preview Mode:** Clicking "Preview" temporarily renders that version's immutable `snapshot_data` into the paper preview with a prominent banner: *"Previewing Version 2 (Read Only) — [Exit Preview] [Restore This Version]"*.
5. **Restore Flow:**
   - Clicking "Restore" opens a confirmation modal:
     > **Restore Version 1?**
     > Restoring will revert this view's configuration, styling, and text overrides back to Version 1.
     > *JobLume AI will automatically create an instant backup checkpoint of your current state before restoring.*
   - Confirmed action dispatches `POST /api/v2/resumes/{id}/versions/{vid}/restore`.
   - The returned restored view updates local state immediately; the new pre-restore checkpoint is added to the version list; toast confirms: *"Restored to Version 1"*.

---

## 6. Preview Engine & Page-Break Simulation

### 6.1 Paper Simulation
The preview canvas mimics physical paper dimensions:
- **Aspect Ratio:** ISO A4 (`210mm x 297mm`) and US Letter (`8.5in x 11in`), toggleable in preview toolbar.
- **Display Scale:** Zoom controls (50%, 75%, 100%, Fit-to-Width) calculated via CSS `transform: scale(...)`.
- **Styling:** Subtle shadow, crisp border, high-contrast white paper sheet against neutral canvas background (`--bg-tertiary`).

### 6.2 Page-Break Calculation Algorithm
1. **Measurement:** A lightweight `ResizeObserver` monitors section DOM elements within the `.resume-sheet` wrapper.
2. **Page Boundary:** The printable page height is computed:
   $$\text{PageHeightPx} = 1123\text{px (at 96 DPI for A4)} - (2 \times \text{MarginPx})$$
3. **Break Projection:** For every section or bullet item, its cumulative `offsetTop + offsetHeight` is evaluated:
   - If an element crosses multiples of $\text{PageHeightPx}$, a dynamic virtual page-break marker is rendered across the preview sheet.
   - Marker displays: `--- Page 2 Boundary (Cut line) ---` with a light red/amber dashed line.
4. **Fit Guidance Pill:** Displayed prominently in the preview header:
   - **`1.0 Page (Optimal)`** (Green) — Content occupies 85%–98% of Page 1.
   - **`1.2 Pages (Overflow Warning)`** (Amber) — Content spills 3–5 lines onto Page 2; recommendations suggested: *"Shorten summary by 2 lines or hide 1 project to fit on 1 page."*
   - **`2.0 Pages (Multi-page Complete)`** (Blue) — Content cleanly fills two pages.
5. **Free Tier Watermark Component:** Rendered as a discreet bottom-right diagonal badge with ~30% opacity (`pointer-events: none`). It exists purely in the preview layer and never injects into export or version snapshot data.

---

## 7. Theme & Contrast Guard

### 7.1 WCAG 2.1 Contrast Calculation
The primary color is used for headings, accent borders, and skill tags against white (`#FFFFFF`) paper backgrounds.
The luminance algorithm calculates relative luminance:
$$L = 0.2126 \times R_{\text{srgb}} + 0.7152 \times G_{\text{srgb}} + 0.0722 \times B_{\text{srgb}}$$
$$\text{Contrast Ratio} = \frac{L_{\text{white}} + 0.05}{L_{\text{color}} + 0.05}$$

### 7.2 Guard Behavior
1. **Thresholds:**
   - $\ge 4.5:1$ — **Compliant (WCAG AA)**.
   - $3.0:1 \text{ to } 4.5:1$ — **Large Text Only** (acceptable for 18pt+ headings, warning for body text).
   - $< 3.0:1$ — **Non-Compliant (Fail)**.
2. **User Feedback:**
   - Displayed directly below the color picker in the Left Panel.
   - Compliant: Green checkmark `4.8:1 (WCAG AA Pass)`.
   - Non-compliant: Amber warning pill: `2.8:1 Low Contrast — hard to read on white paper. [Suggest Darker Variant]`.
   - Clicking `[Suggest Darker Variant]` automatically shifts color lightness down in HSL space to achieve exactly 4.5:1.
   - Per PRD §4.5, saving non-compliant colors is **permitted** (non-blocking warning).

---

## 8. Route Structure & Navigation

### 8.1 Route Map

```
/dashboard
  ├── (index)                 → DashboardHome.tsx
  ├── profile                 → MasterProfilePage.tsx (NEW: Career Source of Truth)
  ├── resumes                 → ResumeLibraryPage.tsx (NEW: V2 Resume View Grid)
  ├── resumes/:id             → ResumeViewEditorPage.tsx (NEW: Workstation)
  ├── resumes/edit/:id        → ResumeRouteResolver.tsx (Inspector: Routes to V2 or Legacy)
  ├── resumes/legacy/edit/:id → ResumeBuilderPage.tsx (LEGACY Fallback)
  ├── templates               → TemplatesPage.tsx (Updated to preview v2 templates)
  ├── job-tailor              → JobTailorPage.tsx (Existing)
  ├── cover-letters           → CoverLetterPage.tsx (Existing)
  ├── ats-scanner             → ATSScannerPage.tsx (Existing)
  ├── applications            → ApplicationTrackerPage.tsx (Existing)
  └── settings                → SettingsPage.tsx (Account Name/Email/Password)
```

### 8.2 Navigation & Sidebar Updates
- **Sidebar Profile Link:** Navigates to `/dashboard/profile` (Master Profile Editor). The existing account settings (name, password) are unified under `/dashboard/settings`.
- **Sidebar Resumes Link:** Navigates to `/dashboard/resumes`.
- **Top Actions:** "Create Resume" everywhere routes to v2 creation flow (`POST /api/v2/resumes` -> `/dashboard/resumes/:id`).

---

## 9. Component Inventory

### 9.1 New Components & Services to Create

| File Path | Description |
| :--- | :--- |
| `frontend/src/services/apiV2.ts` | **Reuses existing axios instance:** Imports the configured `api` instance from `frontend/src/services/api.ts` (preserving the 401 refresh token interceptor and in-memory JWT header from PR-3). Exports strongly typed wrapper functions calling `api.get`, `api.post`, `api.put`, and `api.delete`. Does **not** create a new `axios.create()` instance. |
| `frontend/src/types/v2.ts` | Strict TypeScript types mirroring backend Pydantic schemas (`MasterProfileResponse`, `ResumeViewDetailResponse`, etc.). |
| `frontend/src/context/MasterProfileContext.tsx` | React Context + `useReducer` for Master Profile career bank (Sub-PR B2.1). |
| `frontend/src/context/ResumeEditorContext.tsx` | React Context + `useReducer` for Resume View Workstation manual save (Sub-PR B2.2). |
| `frontend/src/stores/useResumeEditorStore.ts` | Zustand store for fine-grained inline editing and debounced autosave engine (Sub-PR B2.3). |
| `frontend/src/pages/dashboard/MasterProfilePage.tsx` | Master Profile Editor page (10 career bank sections). |
| `frontend/src/pages/dashboard/ResumeLibraryPage.tsx` | V2 Resume View grid listing cards, target jobs, and version counts. |
| `frontend/src/pages/dashboard/ResumeViewEditorPage.tsx` | Main split-pane workstation layout. |
| `frontend/src/components/routing/ResumeRouteResolver.tsx` | Route inspector checking v2 vs legacy resume IDs on legacy routes. |
| `frontend/src/components/editor/EditorToolbar.tsx` | Title input, save button, version count, zoom controls. |
| `frontend/src/components/editor/ConfigPanel.tsx` | Left panel container for tabs: Entries, Styling, Layout. |
| `frontend/src/components/editor/SectionOrderList.tsx` | Drag-and-drop section list with keyboard-accessible up/down controls. |
| `frontend/src/components/editor/EntrySelector.tsx` | Checkbox selector for filtering master entries into view. |
| `frontend/src/components/editor/ThemeSelector.tsx` | Template dropdown, font picker, color picker, contrast guard. |
| `frontend/src/components/editor/PaperPreview.tsx` | Right panel paper canvas with zoom, page break calculation, fit pill. |
| `frontend/src/components/editor/InlineEditable.tsx` | Sanitized contentEditable wrapper for summary and experience bullets. |
| `frontend/src/components/editor/VersionHistoryDrawer.tsx` | Slide-over drawer with version snapshot cards and restore flow. |
| `frontend/src/components/editor/WatermarkOverlay.tsx` | Preview-only non-intrusive watermark overlay for free tier (~30% opacity). |
| `frontend/src/components/templates/TemplateRegistry.ts` | Catalog registering template metadata and component mappings. |
| `frontend/src/components/templates/MinimalAtsTemplate.tsx` | Clean, high-legibility ATS-optimized template component. |
| `frontend/src/components/templates/ModernProfessionalTemplate.tsx`| Modern accent-bar structured template component. |

### 9.2 Modified Files

| File Path | Nature of Modification |
| :--- | :--- |
| `frontend/src/App.tsx` | Add routes for Master Profile (`/dashboard/profile`), V2 Library (`/dashboard/resumes`), V2 Editor (`/dashboard/resumes/:id`), route resolver, and legacy fallback. |
| `frontend/src/components/layout/Sidebar.tsx` | Update navigation links and icons for Master Profile career bank. |
| `frontend/src/pages/dashboard/SettingsPage.tsx` | Incorporate user name/email settings previously in old ProfilePage. |

---

## 10. Complexity Ranking & Implementation Sequence

### 10.1 Complexity & Risk Ranking

```
[Rank 1 - Highest Risk] ── Inline Editing Mechanics (contentEditable, caret restoration, multi-line bullets, override diffing)
[Rank 2 - High Risk]     ── Page-Break Measurement & Fit Guidance (dynamic DOM calculation across fonts and zoom levels)
[Rank 3 - Moderate Risk] ── Autosave Debouncer & Race Condition Handling (optimistic rollbacks, tab synchronization)
[Rank 4 - Moderate Risk] ── Master Profile 10-Section Form & Bullet Tagging (large UI surface, schema compliance, UUID minting)
[Rank 5 - Low/Med Risk]  ── Version History Drawer & Restore Safeguard (state replacement, preview switching)
[Rank 6 - Low Risk]      ── Template System & Registry (data-driven rendering, CSS token isolation)
[Rank 7 - Lowest Risk]   ── Route Transitions, Sidebar Wiring & Contrast Guard Math
```

### 10.2 Construction Strategy
Build the foundational, data-heavy layers first before introducing interactive preview enhancements. This guarantees the API client and data stores are rock-solid before handling complex inline DOM events.

---

## 11. Test Plan

### 11.1 Unit & Component Tests (Vitest + React Testing Library)
1. **Contrast Guard:** Test relative luminance and WCAG AA ratio calculation against edge-case hex colors (`#FFFFFF`, `#000000`, `#2563EB`, `#FBBF24`).
2. **Inline Sanitizer:** Assert pasted HTML containing `<script>`, `style="..."`, or arbitrary `<div>` tags is stripped to plain text or valid `<strong>`/`<em>`.
3. **Override Diffing:** Assert editing an experience bullet dispatches precisely `content_overrides[exp_id].bullets[bullet_id] = text`, leaving untouched bullets clean.
4. **Keyboard Reordering:** Assert triggering "Move Up" button shifts section order index and updates `aria-live` announcement.
5. **Route Resolver:** Assert `<ResumeRouteResolver />` correctly branches between v2 editor and legacy builder based on API response.

### 11.2 End-to-End User Journey Tests (Playwright)
- **Journey 1: Master Career Bank Curation**
  User navigates to `/dashboard/profile` → adds experience entry with 2 tagged bullets → adds skills with tags → reloads page → verifies persistence from backend.
- **Journey 2: View Tailoring & Styling (Manual Save)**
  User creates new resume view → deselects 1 entry → reorders skills above experience → switches primary color → clicks "Save Changes" → asserts view persists.
- **Journey 3: Inline Overrides & Version Snapshot**
  User clicks summary in preview → edits text inline → asserts autosave indicator reflects "All changes saved" → clicks "Save Version" with label "Tailored v1" → asserts v1 appears in history drawer.
- **Journey 4: Version Restoration Safeguard**
  User changes template and deletes text → opens drawer → clicks "Restore v1" → confirms dialog → asserts checkpoint v2 is auto-created and view reverts to v1 config.

---

## 12. Sub-Phasing & Milestone Deliverables

To maintain velocity, eliminate mammoth PRs, and ensure thorough review at each milestone, Phase B.2 is divided into **three structured sub-PRs**:

### Sub-PR B2.1: Master Profile & API Client Foundation
- **Deliverables:**
  - `frontend/src/services/apiV2.ts` (reusing `api.ts` axios instance) and `frontend/src/types/v2.ts`.
  - Master Profile State via React Context + `useReducer` (`MasterProfileContext.tsx`). **Zero Zustand in B2.1.**
  - Dedicated Master Profile Editor page (`/dashboard/profile`) supporting all 10 canonical career bank sections.
  - Bullet tagging UI (`BulletItemSchema`) and skill tag pill editor (`SkillItemSchema`).
  - Unit tests for data normalization and UUID minting.
- **Verification:** User can populate their complete career bank; data persists cleanly to `GET/PUT /api/v2/profile`.

### Sub-PR B2.2: Resume View Workstation, Templates & Live Preview (Manual Save)
- **Deliverables:**
  - V2 Resume View Library grid (`/dashboard/resumes`).
  - Route Resolver (`<ResumeRouteResolver />`) resolving `/dashboard/resumes/edit/:id` via API lookup.
  - Resume Editor Shell (`/dashboard/resumes/:id`) with split layout powered by React Context + `useReducer` (`ResumeEditorContext.tsx`).
  - Left panel controls: Entry selection checkboxes, section order drag-and-drop + keyboard controls, section visibility toggles.
  - Template Registry with initial 2 templates (`minimal-ats`, `modern-professional`).
  - Live paper preview canvas with page-break lines and fit guidance pill.
  - Color picker with WCAG contrast guard calculation.
  - **Manual Save Only:** Toolbar includes explicit "Save Changes" button. Clicking Save fires `PUT /api/v2/resumes/{id}` and updates state. **No debouncing, no dirty timers, no offline queue in B2.2.**
- **Verification:** User can create a view from their master profile, select entries, reorder sections, adjust styling, click Save, and observe the live multi-page preview.

### Sub-PR B2.3: Inline Editing, Autosave & Version History Drawer
- **Deliverables:**
  - `<InlineEditable />` preview mechanics for summary and experience bullets (keyboard shortcuts `Ctrl+B`, `Ctrl+I`, `Ctrl+K`).
  - Staging inline changes into `content_overrides` without touching master data.
  - Transition of workstation state to Zustand (`useResumeEditorStore.ts`) for fine-grained subscription isolation.
  - 1000ms debounced autosave engine layered over the B2.2 save function, with status indicators (`Saving...`, `Unsaved changes`, `All changes saved`) and `sessionStorage` offline queue.
  - Version History slide-over drawer with version preview mode.
  - Instant version restore flow with automatic checkpoint generation.
  - Playwright E2E test suite covering complete user journeys.
- **Verification:** Full end-to-end authoring experience: inline editing, automatic saving, snapshot generation, and reliable rollback.

---

## 13. Resolved Review Questions

All four open design questions from v1.0 have been aligned and resolved based on review feedback in Session 30:

1. **Routing & Account Settings:**
   **RESOLVED.** Account settings (name, email, password) move to `/dashboard/settings`. `/dashboard/profile` is officially repurposed as the **Master Profile (Career Bank) Editor**.
2. **Inline Formatting:**
   **RESOLVED.** Inline editing in B.2 strictly supports keyboard shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+K`). Floating tooltip bubbles are deferred to Phase B.3.
3. **Free Tier Watermark Positioning:**
   **RESOLVED.** Implemented as a discreet bottom-right diagonal badge with ~30% opacity on the paper canvas. Preview overlay only; zero gating logic in B.2.
4. **Sub-PR Cadence:**
   **RESOLVED.** The 3-sub-PR breakdown (B2.1 Master Profile → B2.2 Workstation/Templates with Manual Save → B2.3 Inline Editing/Autosave/Versions) is approved, with review and validation gates after each sub-PR.
