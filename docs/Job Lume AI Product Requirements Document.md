# Job Lume AI: Product Requirements Document

Version 1.0 | Status: Draft for review | Date: October 19, 2026

## 1. Overview

### 1.1 Product Vision

Job Lume AI is an AI-powered resume and job-application workspace. Users build one **Master CV** that holds everything about their career, then generate polished, ATS-friendly, job-specific resumes from it in seconds, and track every application in one place.

### 1.2 Problem Statement

Job seekers keep many resume files, rewrite them by hand for each role, lose track of which version went to which company, and struggle to match job descriptions (JDs) and applicant tracking systems (ATS). Existing builders are template-first and treat the resume as a single static document.

### 1.3 Core Idea (the key optimization)

The original flow treats the resume as the main object. This PRD makes a structural change:

- **Master Profile** = the single source of truth (structured data, never overwritten by AI without approval).
- **Resume** = a *view* of the Master Profile: a selection of content + a template + theme + AI-tailored wording.
- **Version** = an immutable snapshot of a Resume, optionally linked to a Job Application.

This makes tailoring, version control, company-specific resumes and template switching all consistent and cheap, because content is separated from presentation.

### 1.4 Goals

1. Get a new user from sign-up to a downloadable resume in under 5 minutes.
2. Make tailoring a resume to a JD a one-click, reviewable action.
3. Give users a clear history of what they sent to whom.
4. Convert anonymous playground visitors to sign-ups.

### 1.5 Non-Goals (v1)

- Cover letter generation, interview prep and LinkedIn optimization (candidates for v2).
- Automatic job applying or job board scraping.
- Recruiter-side features.
- Native mobile apps (the web app must be responsive).

## 2. Target Users and Personas

| Persona | Description | Key need |
| --- | --- | --- |
| Active job seeker | Applies to 10 to 50+ roles | Fast tailoring, tracking |
| Fresh graduate | Little experience, unsure what to include | Guidance, good templates |
| Career switcher | Needs to reframe experience | AI rewriting, JD matching |
| Passive professional | Updates CV occasionally | One place to keep everything current |

## 3. User Flow (Optimized)

1. **Land** on Job Lume AI. Visitors may try the **Playground** without an account.
2. **Sign up / log in** (email, Google, LinkedIn).
3. **Onboarding**: build the Master Profile by one of three paths: (a) upload an existing resume (PDF/DOCX) for AI parsing, (b) import from LinkedIn export, (c) fill in guided forms.
4. **Review and confirm** parsed data (the user always verifies before it is saved).
5. **Choose a template** and see a live preview immediately.
6. **Resume generated** (the "Base Resume") and saved as Version 1.
7. **Customize**: edit text inline, change primary color, reorder, add or remove sections.
8. **Optimize with AI**: prompt-based enhancement or JD-based tailoring, shown as a reviewable diff.
9. **Save as a version**, optionally attached to a job application.
10. **Track** applications on the job board; download any version at any time.

## 4. Feature Set

Priority key: **P0** = MVP, **P1** = launch fast-follow, **P2** = later.

### 4.1 Authentication and Account (P0)

- Email/password, Google and LinkedIn sign-in.
- Email verification, password reset.
- Account settings, data export, account deletion (GDPR-style).

### 4.2 Master Profile (P0)

The structured data store for all career information.

**Sections supported:** Personal details, Summary, Experience, Education, Projects, Skills, Certifications, Awards, Publications, Languages, Volunteering, Links, and **custom sections**.

**Requirements**

- Each entry is a structured record (for example an Experience entry has company, title, location, dates, bullets, tags).
- Bullets can be tagged (for example "leadership", "backend") to help AI selection.
- Import from PDF/DOCX with AI parsing and a mandatory review screen.
- Autosave with last-saved indicator.
- Profile completeness meter with suggestions.
- Master Profile is never modified by AI silently. Any AI change is a suggestion the user accepts or rejects.

### 4.3 Templates (P0)

- Launch with 6 to 8 templates (for example Classic, Modern, Compact, Creative, Academic, Executive), all **ATS-safe** (real text, single reading order, standard headings).
- Template switching preserves all content and customization.
- Templates are defined as data + layout components so new ones can be added without code changes to the editor.
- Page size options: A4 and US Letter.
- Live preview with page-break indicators; automatic fit guidance ("your resume is 1.2 pages").

### 4.4 Resume Editor (P0)

- **Inline editing**: click any text in the preview to edit; changes sync back to the underlying resume content.
- **Resume-level content vs Master content**: edits made in a resume affect that resume only, with an optional "also update Master Profile" action.
- Rich text limited to what ATS handles (bold, italic, bullets, links).
- Undo/redo and autosave.
- Per-section and per-entry visibility toggles (include or hide an item without deleting it from the Master).

### 4.5 Theme Customization (P0)

- Color picker changes the **primary color only** (headings, accents, dividers, icons, name).
- Body text stays black and the page background stays white, as specified.
- Implemented with a single design token (`--resume-primary`) so every template responds consistently.
- **Contrast guard**: warn (and suggest an adjusted shade) if the chosen color fails minimum contrast against white. Colors that fail are still allowed after a warning for decorative elements.
- Presets plus custom hex input; the chosen color persists per resume.
- Font choice from a small ATS-safe set (P1).

### 4.6 Section Management (P0)

- Drag-and-drop reordering of sections (default sections included).
- Add, hide, rename and delete sections; add custom sections.
- Required fields (name, contact) cannot be deleted, only edited.
- Deleting a section from a resume never deletes it from the Master Profile (hide vs delete is explained in the UI).

### 4.7 AI Optimization (P0)

All AI actions produce **suggestions shown as a diff**, which the user can accept, reject or edit, line by line. Live-update applies once accepted (or immediately in an "apply and undo" mode the user can choose).

**Actions**

- Free-form prompt ("make this more concise", "emphasize leadership").
- Quick actions: improve bullet, shorten to one page, strengthen verbs, quantify impact (asks the user for real numbers rather than inventing them), fix grammar, adjust tone.
- Section-scoped or whole-resume scope.
- Streaming responses with live preview.

**Guardrails (critical)**

- AI must not invent employers, titles, dates, degrees, metrics or skills. Anything not present in the Master Profile is flagged as "needs your input".
- A "truthfulness check" highlights any claim in the output that is not traceable to Master Profile data.
- Sensitive data (phone, email, address) is minimized in prompts where possible.

### 4.8 JD-Based Tailoring (P0)

The flagship feature.

1. User pastes JD text, uploads a file, or provides a URL (P1 for URL).
2. AI extracts role, company, required skills, keywords and seniority.
3. **Match analysis**: match score, matched keywords, missing keywords, and which Master Profile items are most relevant.
4. AI builds a **new tailored version**: selects and orders relevant entries, rewrites summary and bullets with JD keywords (only where truthful), and reorders sections.
5. User reviews the diff and saves.
6. The result is saved as a new Resume Version linked to the job application. The Master Profile and Base Resume are untouched.

The optimization versus the original spec: the AI creates a new **resume version derived from the Master Profile**, not a new Master CV, so the Master stays clean.

### 4.9 ATS Check (P1)

- ATS compatibility score (parsing friendliness, formatting, keyword coverage).
- Actionable issue list (missing sections, graphics-heavy elements, unusual headings).
- Optional: keyword coverage against a pasted JD.

### 4.10 Version Control (P0)

- Every save creates an immutable **version** with timestamp, label, source (manual, AI prompt, JD tailoring) and optional note.
- Version history per resume: view, compare (side-by-side diff), restore, duplicate, rename.
- **Company-specific resumes**: a resume (or version) can be tagged with a company and role and linked to a job application.
- Auto-versioning on major AI actions, with undo history for small edits.
- Retention: free plan keeps the latest N versions; paid plan unlimited (see Section 9).

### 4.11 Job Tracking Portal (P0)

Full CRUD on job applications.

**Fields:** company, role, job URL, location, work type (remote/hybrid/onsite), salary range, source, status, applied date, deadline, contact person, notes, JD text, linked resume version, attachments.

**Views**

- Kanban board by status (Saved, Applied, Screening, Interview, Offer, Rejected, Withdrawn), with drag-and-drop.
- Table/list view with search, filter and sort.
- Application detail page with timeline (status changes, notes, resume sent).

**Actions per application**

- "Tailor resume for this job" (launches JD tailoring with the JD prefilled).
- Attach or change the resume version used; download it directly.
- Reminders and follow-up dates (P1: email notifications).
- Basic analytics (P1): applications per week, response rate, stage conversion.

### 4.12 Export and Sharing (P0 / P1)

- PDF export (P0) with selectable text, correct fonts and page breaks.
- DOCX export (P1).
- Plain-text export for ATS paste fields (P1).
- Downloading any saved version, including old ones, at any time.
- Shareable read-only public link with optional expiry and a revoke option (P2).
- File naming convention, for example `FirstName_LastName_Company_Role.pdf`.

### 4.13 Playground (P0)

Try-before-signup experience.

- No login required; limited number of AI attempts (default 3 per visitor, tracked by device fingerprint plus IP rate limiting, to be validated for abuse).
- Visitors can fill a short sample profile (or load sample data), pick a template, change color, and try one AI optimization.
- Data stored locally in the browser only; nothing persisted server-side until sign-up.
- Export is gated (watermarked PDF or sign-up required) to drive conversion.
- On sign-up, playground work is **imported into the user's Master Profile**.
- Clear counter ("2 of 3 free AI attempts left") and a sign-up call to action when exhausted.

### 4.14 Additional Recommended Features (new)

| Feature | Priority | Why |
| --- | --- | --- |
| Resume import (PDF/DOCX) with AI parsing | P0 | Removes the biggest onboarding barrier |
| Profile strength and resume score | P1 | Guides users and drives engagement |
| Cover letter generator from JD + profile | P2 | Natural extension of tailoring |
| Multi-language resumes | P2 | Broader market |
| Browser extension to save jobs | P2 | Speeds job capture |
| Team/career-coach sharing and comments | P2 | B2B2C opportunity |
| LinkedIn profile import | P1 | Faster onboarding |

## 5. Information Architecture

- **Dashboard**: recent resumes, application summary, profile completeness, quick actions.
- **Master Profile**: all sections, import.
- **Resumes**: list, editor, version history.
- **Jobs**: kanban and table, application detail.
- **Templates** (gallery, also reachable in the editor).
- **Settings**: account, billing, data and privacy.
- **Playground** (public, separate entry).

## 6. Functional Requirements (Summary Table)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | User can create and edit a structured Master Profile with all standard and custom sections | P0 |
| FR-2 | User can import an existing resume and review parsed data before saving | P0 |
| FR-3 | User can generate a resume from the Master Profile using any template | P0 |
| FR-4 | User can edit resume text inline with a live preview | P0 |
| FR-5 | User can change the primary color only; text stays black and background white | P0 |
| FR-6 | User can add, hide, delete, rename and reorder sections | P0 |
| FR-7 | User can run AI optimization by prompt with a reviewable diff | P0 |
| FR-8 | User can supply a JD and receive a match analysis and a tailored resume version | P0 |
| FR-9 | System saves immutable versions; user can compare and restore | P0 |
| FR-10 | User can tag a resume version with company and role | P0 |
| FR-11 | User can create, read, update and delete job applications | P0 |
| FR-12 | User can link and download resume versions from an application | P0 |
| FR-13 | User can export to PDF | P0 |
| FR-14 | Anonymous visitor can use the playground with limited AI attempts | P0 |
| FR-15 | Playground data carries over on sign-up | P1 |
| FR-16 | ATS score and keyword analysis | P1 |
| FR-17 | DOCX and plain-text export | P1 |
| FR-18 | Reminders and follow-up notifications | P1 |

## 7. Non-Functional Requirements

**Performance**

- Editor interactions and preview updates under 100 ms perceived latency.
- First AI tokens streamed within 2 seconds; full resume tailoring completes within 30 seconds.
- PDF generation under 5 seconds.

**Reliability**

- Autosave with conflict handling; no data loss on tab close or network drop (local draft buffer).
- Target 99.9% uptime for core app.

**Security and Privacy**

- Resumes contain personal data: encryption in transit and at rest; strict per-user access control.
- AI provider calls must not use user data for model training; this is stated in the privacy policy.
- Rate limiting and abuse protection on the playground and AI endpoints.
- Full data export and deletion on request.

**Accessibility and Compatibility**

- WCAG 2.1 AA for the app UI; keyboard-accessible drag-and-drop alternatives.
- Latest two versions of Chrome, Safari, Edge, Firefox; responsive down to mobile (editing is simplified on small screens).

**Quality**

- Exported PDFs must be parseable by common ATS tools (text selectable, logical reading order).
- AI output evaluation set (hallucination rate, keyword relevance) run before each model or prompt change.

## 8. Technical Considerations (Recommendations)

### 8.1 Data Model (high level)

- **User** (id, plan, settings)
- **MasterProfile** (userId, sections as structured JSON, tags)
- **Resume** (userId, name, templateId, theme {primaryColor, font}, sectionOrder, sectionVisibility, content overrides, companyTag)
- **ResumeVersion** (resumeId, snapshot JSON, source, note, createdAt, immutable)
- **JobApplication** (userId, company, role, status, JD text, links, dates, notes, resumeVersionId)
- **ApplicationEvent** (applicationId, type, timestamp, note)
- **AIJob** (userId, type, inputs, output, tokens, status)
- **Template** (id, config, layout component, version)

### 8.2 Architecture Notes

- Store resume content as **structured JSON**, render via template components; the same renderer drives the live preview and PDF export so output matches exactly.
- Use snapshot versions with diffing computed on demand.
- AI calls through a backend service layer (never directly from the client) with prompt templates, schema-validated JSON outputs, and per-user and per-IP quotas.
- Playground state in browser local storage plus a lightweight anonymous session for quota.
- Background jobs for file parsing and PDF rendering.

### 8.3 Suggested Stack (open to team decision)

React/Next.js frontend, Node or Python API, PostgreSQL, object storage for uploads and exports, headless Chromium for PDF, an LLM provider API, Redis for rate limits and queues.

## 9. Monetization (Proposed)

| Plan | Includes |
| --- | --- |
| Free | Master Profile, 2 resumes, 3 templates, limited monthly AI credits, watermark-free PDF with limits, 5 job applications tracked |
| Pro | All templates, higher AI credits, unlimited versions and applications, DOCX export, ATS check, analytics |
| Playground | Anonymous, 3 AI attempts, watermarked export |

AI usage is metered through credits to control cost.

## 10. Success Metrics

| Area | Metric | Target (6 months) |
| --- | --- | --- |
| Activation | Sign-up to first downloaded resume | 60% within first session |
| Time to value | Median time to first resume | under 5 minutes |
| Core feature | Share of active users running a JD tailoring | 40% |
| Retention | Week-4 returning users | 25% |
| Playground | Playground to sign-up conversion | 12% |
| Quality | AI suggestions accepted | above 60% |
| Trust | Reported hallucination or factual issues | below 1% of AI actions |
| Tracker | Users with 3 or more tracked applications | 30% |

## 11. Release Plan

**Phase 1: MVP (about 10 to 12 weeks)** Auth, Master Profile, import, 4 templates, editor with inline editing, color theming, section management, PDF export, basic AI prompt optimization, version history, playground.

**Phase 2: Launch (about 6 to 8 weeks)** JD tailoring with match analysis, job tracker (kanban, table, linking versions), 8 templates, ATS check, DOCX export, billing.

**Phase 3: Growth** Reminders and analytics, LinkedIn import, URL-based JD import, public share links, cover letters, browser extension.

## 12. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| AI invents or exaggerates experience | Diff review, truthfulness check, "needs your input" flags, no silent writes |
| Inline editing and template layouts become inconsistent | Single structured data model and shared renderer |
| Playground abuse and AI cost spikes | Rate limits, quotas, bot protection, capped model usage |
| PDF parsing errors on import | Mandatory review screen, support for manual entry |
| Private data leakage | Encryption, access control, no-training agreements with AI vendors |
| Template color choices harm readability | Contrast guard and presets |
| Version storage growth | Snapshot compression, plan-based retention |

## 13. Open Questions

1. Should edits made in a resume optionally sync back to the Master Profile by default, or only on request?
2. What exact limits apply to Free vs Pro (AI credits, versions, resumes)?
3. Is the playground attempt limit per device, per IP, or both, and how is it enforced?
4. Which markets and languages does v1 target (ATS norms and resume conventions differ by country)?
5. Should the resume allow a profile photo (common in some regions, discouraged for ATS in others)?
6. Which LLM provider(s) will be used, and what are the data residency requirements?

## 14. Summary of Changes to the Original Feature Set

- Introduced a clear separation of **Master Profile, Resume and Version**, so AI never overwrites core data.
- JD upload now creates a **tailored version** rather than a new Master CV.
- AI changes are **reviewable diffs** with truthfulness guardrails.
- Added import from existing resumes, ATS checking, contrast guard for color theming and a playground-to-account handoff.
- Added hide vs delete semantics for sections, version comparison and restore, and application-linked resumes.
- Defined priorities (P0/P1/P2), metrics, risks and a phased release plan.
