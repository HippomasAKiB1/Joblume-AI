# Phase B.1 Execution Plan: Master Profile Hierarchy & Data Model Refactor (Backend)

**Document Version:** 1.1
**Status:** DRAFT — Ready for User Approval
**Target Release:** Phase B.1 (Backend Only)
**Dependencies:** Alembic `0002_phase_a_auth_and_billing`, Sentry error monitoring (PR-5 active)

---

## Revision Log (v1.0 → v1.1)
- **Rev 1 (Section Defaults Complete)**: Updated `section_order` and `section_visibility` in §2 DDL to include all 10 standard sections (`languages`, `awards`, `custom_sections` added) preventing silent omission of user data.
- **Rev 2 (Unambiguous Skills Schema)**: Standardized skills in §2, §4.1, and §5.2 as strictly typed `list[SkillItemSchema]` (`{"name": str, "tags": list[str]}`) eliminating mixed-type parsing risks.
- **Rev 3 (In-Migration Data Execution)**: Replaced external background script / delta-sync in §3.1 and §6 with transactional execution inside Alembic `0003`'s `upgrade()`, ensuring atomic DDL + data migration with zero runbook overhead.
- **Rev 4 (Legacy Template Mapping)**: Explicitly mapped legacy `template_name` to new `template_id` in §3.1 to preserve user visual choices.
- **Rev 5 (Version Creation Concurrency Lock)**: Added `SELECT id FROM resumes_v2 WHERE id = :view_id FOR UPDATE` in §5.3 to eliminate race conditions on `version_number` generation.
- **Rev 6 (Safe Restore Checkpoint)**: Updated `restore_version` in §5.3 to automatically capture a pre-restore snapshot (`label="Before restore"`, `change_source="restore_checkpoint"`) enabling undo capability.
- **Rev 7 (Deferred Version Pruning)**: Removed auto-pruning in §3.4, §5.3, §9.3, and §10.3; versions will be tracked and warned near 20 in B.2 UI without destructive deletion.
- **Rev 8 (Concrete Resolution Engine Contract)**: Provided complete before-and-after JSON contracts in §4 and §5.2 detailing Master bullets, `selected_entry_ids`, `content_overrides`, and resolved output across sections.
- **Rev 9 (Server-Side Cross-User Isolation)**: Specified strict ownership validation on all `/api/v2/*` endpoints in §5 and added explicit multi-tenant isolation tests in §9 (404 on foreign view lookup/mutation, 400 on foreign master assignment).
- **Rev 10 (Post-Migration Rollback Safety)**: Added explicit export-before-downgrade instruction in §7 to protect post-migration v2 edits if rollback is required.
- **Rev 11 (B.2 Master Trimming Affordance Handoff)**: Documented B.2 UI requirement to provide a Master Profile curation / trimming interface in §1.3.

---

## 1. Objective and Scope

### 1.1 Context
In Phase A, JobLume AI established production-grade authentication, session security, structured logging, error monitoring via Sentry, and database baseline schemas. However, resumes remain stored as monolithic, disconnected documents (`resumes.json_data`). This flat document model forces users to re-enter career data for every new resume, risks silent overwrites during AI tailoring, and lacks an immutable historical audit trail.

### 1.2 Objective
Phase B introduces the PRD-mandated three-tier data hierarchy (§4.2, §4.3, §4.10):
```
        ┌──────────────────────────────────────────────────┐
        │        Master Profile (Source of Truth)          │
        │      Canonical career repository per user        │
        └────────────────────────┬─────────────────────────┘
                                 │
                                 ▼ 1-to-many (views)
        ┌──────────────────────────────────────────────────┐
        │         Resume View (resumes_v2)                 │
        │   Style, template, selection & content overrides │
        └────────────────────────┬─────────────────────────┘
                                 │
                                 ▼ 1-to-many (snapshots)
        ┌──────────────────────────────────────────────────┐
        │      Resume Version (resume_versions)            │
        │    Immutable historical snapshots (AI & manual)  │
        └──────────────────────────────────────────────────┘
```

### 1.3 Scope Boundaries

#### Included in Phase B.1 (Backend Only):
- **Database Schema**: Alembic migration `0003_master_profile_hierarchy` adding `master_profiles`, `resumes_v2`, and `resume_versions` tables with strict constraints, indexes, and UUID keys.
- **In-Migration Data Population**: Atomic data migration embedded directly inside Alembic `0003`'s `upgrade()` converting existing `resumes.json_data` into canonical `master_profiles`, corresponding `resumes_v2` views (preserving `template_name`), and initial baseline `resume_versions` (Version 1).
- **Service Layer**:
  - `MasterProfileService`: CRUD, normalization, JSON validation, item UUID minting, and strict tenant ownership enforcement.
  - `ResumeViewService`: View configuration (section order/visibility/entry selection), content overrides management, tenant validation, and full view resolution engine.
  - `ResumeVersionService`: Snapshot creation with row-level locking (`FOR UPDATE`), pre-restore safety checkpoints, and version restoration.
- **API Surface**: New `/api/v2/*` router covering Profile, Resumes, Overrides, and Versions.
- **Automated Tests**: Unit and integration test suite asserting data resolution, cross-user security isolation, concurrency serialization, and zero regression on legacy `/resume/*` endpoints.

#### Explicitly Deferred (Phase B.2+):
- **Frontend UI Changes**: The Master Profile editor, React multi-view editor, and inline override UI belong to Phase B.2.
- **Master Profile Curation Affordance (Handoff to B.2)**: Because migration unions items from multiple legacy resumes into Master, Phase B.2's UI must include a "trim Master Profile" interface so users can easily review and clean up older merged entries.
- **Interim Unmigrated Cohort Sync**: Frontend users creating resumes on legacy `/resume/*` endpoints between B.1 backend deployment and B.2 frontend cutover will have their rows re-migrated to v2 as part of the B.2 cutover routine.
- **Serverless PDF Rendering**: Chromium/Puppeteer serverless microservice belongs to Phase B.3.
- **Old Route Deprecation**: `/resume/*` routes remain active and unchanged until the frontend transitions in Phase B.2.

---

## 2. Data Model & Schema (DDL)

All new tables use `UUID` primary keys with PostgreSQL `gen_random_uuid()`. Foreign keys referencing `users(id)` use `VARCHAR(36)` to match the existing `users.id` type in `0001_initial_baseline`.

```sql
-- ====================================================================
-- 1. Master Profiles Table (Canonical Single Source of Truth per User)
-- ====================================================================
CREATE TABLE master_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    personal_info JSONB NOT NULL DEFAULT '{
        "fullName": "",
        "email": "",
        "phone": "",
        "location": "",
        "website": "",
        "linkedin": "",
        "github": "",
        "portfolio": "",
        "photo_url": null
    }'::jsonb,
    summary TEXT NOT NULL DEFAULT '',
    experience JSONB NOT NULL DEFAULT '[]'::jsonb,      -- Array of ExperienceItem: {"id": str, "title": str, "company": str, "location": str, "startDate": str, "endDate": str, "current": bool, "bullets": [{"id": str, "text": str, "tags": [str]}]}
    education JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Array of EducationItem: {"id": str, "institution": str, "degree": str, "field": str, "startDate": str, "endDate": str, "gpa": str}
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,        -- Array of ProjectItem: {"id": str, "name": str, "description": str, "technologies": str, "link": str}
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,          -- Array of SkillItem: {"name": str, "tags": [str]}
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of CertificationItem: {"id": str, "name": str, "issuer": str, "date": str, "url": str}
    languages JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Array of LanguageItem: {"id": str, "name": str, "level": str}
    awards JSONB NOT NULL DEFAULT '[]'::jsonb,          -- Array of AwardItem: {"id": str, "title": str, "issuer": str, "date": str, "description": str}
    custom_sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of CustomSection: {"id": str, "title": str, "items": [{"id": str, "title": str, "subtitle": str, "date": str, "description": str}]}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_master_profiles_user UNIQUE (user_id),
    CONSTRAINT fk_master_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_master_profiles_user_id ON master_profiles(user_id);

-- ====================================================================
-- 2. Resumes Table (Views over Master Profile)
-- ====================================================================
CREATE TABLE resumes_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    master_profile_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Resume',
    template_id VARCHAR(100) NOT NULL DEFAULT 'modern-professional',
    primary_color VARCHAR(30) NOT NULL DEFAULT '#4F46E5',
    font_family VARCHAR(50) NOT NULL DEFAULT 'Inter',
    section_order JSONB NOT NULL DEFAULT '["personal","summary","experience","education","skills","projects","certifications","languages","awards","custom_sections"]'::jsonb,
    section_visibility JSONB NOT NULL DEFAULT '{
        "personal": true,
        "summary": true,
        "experience": true,
        "education": true,
        "skills": true,
        "projects": true,
        "certifications": true,
        "languages": true,
        "awards": true,
        "custom_sections": true
    }'::jsonb,
    selected_entry_ids JSONB NOT NULL DEFAULT '{}'::jsonb, -- Map of section -> list of entry UUIDs: {"experience": [uuid1, uuid2], "projects": [uuid3]}
    content_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Map of entry ID -> field overrides
    target_job_title VARCHAR(255),
    target_company VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_resumes_v2_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_resumes_v2_master FOREIGN KEY (master_profile_id) REFERENCES master_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_resumes_v2_user_id ON resumes_v2(user_id);
CREATE INDEX idx_resumes_v2_master_id ON resumes_v2(master_profile_id);

-- ====================================================================
-- 3. Resume Versions Table (Immutable Snapshots)
-- ====================================================================
CREATE TABLE resume_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    label VARCHAR(255) NOT NULL DEFAULT 'Manual Save',
    change_source VARCHAR(50) NOT NULL DEFAULT 'manual', -- manual, ai_tailor, ai_refine, migration, restore_checkpoint
    snapshot_data JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resume_version_number UNIQUE (resume_id, version_number),
    CONSTRAINT fk_resume_versions_resume FOREIGN KEY (resume_id) REFERENCES resumes_v2(id) ON DELETE CASCADE
);

CREATE INDEX idx_resume_versions_resume_id ON resume_versions(resume_id, version_number DESC);

-- ====================================================================
-- 4. Foreign Key Link on Applications Table (Optional Future Link)
-- ====================================================================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_version_id UUID;
ALTER TABLE applications ADD CONSTRAINT fk_applications_resume_version
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE SET NULL;
```

---

## 3. Architecture & Core Decisions

### 3.1 Migration Strategy & In-Migration Execution
- **Cardinality**: **One Master Profile per user** (canonical).
- **Execution Method**: Executed **synchronously inside Alembic `0003`'s `upgrade()`** function using `op.get_bind()`.
  - Transactional atomicity: DDL and data migration commit or roll back together.
  - Zero runbook complexity: No external script to invoke or monitor.
  - Runtime: <100ms in production today (0 existing production resumes).
- **Lazy Creation for Users with Zero Resumes**:
  Users who have zero legacy resumes are skipped during migration. An empty Master Profile is created lazily upon their first call to `/api/v2/profile` or `/api/v2/resumes`.
- **Multi-Resume Resolution Rule (for users with resumes)**:
  1. Resumes are queried grouped by `user_id`, ordered by `updated_at DESC`.
  2. The most recently updated resume serves as the **Base Document** for the initial `master_profiles` row.
  3. Older resumes are scanned for unrepresented items:
     - *Experience*: Compared by `(company, title, startDate)`. If not found in the Base Document, appended to `experience`.
     - *Education*: Compared by `(institution, degree)`. If not present, appended to `education`.
     - *Projects / Skills*: Appended if distinct.
  4. Each legacy resume generates one `resumes_v2` row referencing this `master_profiles` record.
     - **Template Preservation**: `template_id` is explicitly set to `legacy_resume.template_name` (preserving user visual choice).
     - Any text variations in older resumes are captured in `content_overrides` for that specific view.
  5. An initial `resume_versions` row (Version 1, `label='Initial Migration'`, `change_source='migration'`) is created for each view, preserving an exact 1:1 frozen snapshot of the legacy resume.
- **Interim Cohort Policy**:
  Any legacy resumes created on `/resume/*` between B.1 backend deploy and B.2 frontend deployment will not immediately appear in `resumes_v2`. This cohort will be re-migrated cleanly as part of the B.2 cutover routine.

### 3.2 Master Profile Schema Decisions
- **Personal Info**: Stored in `personal_info` JSONB. Includes `photo_url: Optional[str]` per approved PRD Decision Q3.
- **Section Arrays**: `experience`, `education`, `projects`, `certifications`, `languages`, `awards` are stored as JSONB arrays of objects with unique string `id`s (UUIDv4 minted during migration/creation).
- **Skills Schema**: Unambiguously typed as `list[SkillItemSchema]` where `SkillItemSchema = {"name": str, "tags": list[str] = []}`.
- **Inline Tagging on Bullets**:
  Bullets in `experience` are structured objects:
  ```json
  {
    "id": "b-uuid-001",
    "text": "Architected low-latency caching layer reducing p99 latency by 45%.",
    "tags": ["performance", "backend", "redis"]
  }
  ```
  Tags are stored inline in JSONB (GIN indexing deferred until search/filter requirements in Phase C).
- **Master Profile Versioning**: Handled via `updated_at TIMESTAMPTZ`.

### 3.3 Resume View & Content Overrides Contract
A Resume View stores display and tailoring configurations without duplicating master data:
1. `section_order`: 10-section array defining render order.
2. `section_visibility`: 10-section map `{ [section]: boolean }` controlling display.
3. `selected_entry_ids`: Map of section -> list of entry IDs included in this view, e.g. `{"experience": ["e-uuid-1", "e-uuid-2"], "projects": ["p-uuid-1"]}`.
4. `content_overrides`: Structured map keyed by `master_entry_id` (or section key for global text):

#### Concrete Example of Content Override Lifecycle:
```json
// 1. Master Profile Bullet (Canonical)
{
  "id": "e-uuid-101",
  "company": "Acme Corp",
  "title": "Software Engineer",
  "bullets": [
    {
      "id": "b-uuid-201",
      "text": "Built distributed data pipelines using Python and Kafka.",
      "tags": ["python", "kafka"]
    }
  ]
}

// 2. Resume View content_overrides
{
  "e-uuid-101": {
    "title": "Senior Distributed Systems Engineer",
    "bullets": {
      "b-uuid-201": "Architected mission-critical data pipelines processing 2TB daily via Kafka and Python."
    }
  },
  "summary": "Distributed systems engineer specializing in high-throughput Kafka streaming."
}

// 3. Rendered Output (resolved_data)
{
  "title": "Senior Distributed Systems Engineer", // Overridden
  "company": "Acme Corp",                          // From Master
  "bullets": [
    {
      "id": "b-uuid-201",
      "text": "Architected mission-critical data pipelines processing 2TB daily via Kafka and Python.", // Overridden
      "tags": ["python", "kafka"]                  // Tags preserved
    }
  ]
}
```

### 3.4 Resume Version Snapshot & Retention Policy
- **Snapshot Contents**: A self-contained, fully resolved JSON document combining Master Profile data + selected entry IDs + content overrides + template styling (`primary_color`, `font_family`, `template_id`).
- **Retention Policy (Revised)**:
  - **Auto-pruning on save is DEFERRED**. No versions are automatically deleted in Phase B.1.
  - The API tracks `version_number` and returns total version counts.
  - Phase B.2 UI will surface an informational warning when a Free tier user approaches 20 versions.
  - Deletion/pruning policies will be established post-launch after real customer usage metrics are gathered.

---

## 4. API Surface (`/api/v2/*`)

All endpoints require JWT authentication (`get_current_user`). Every endpoint validates that the target resource belongs to `current_user.id`; unauthorized access returns `404 Not Found` (never 403, preventing existence leaks).

| Method | Endpoint | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v2/profile` | Fetch user's Master Profile (lazy creates if absent) | None | `MasterProfileResponse` |
| `PUT` | `/api/v2/profile` | Update user's Master Profile | `MasterProfileUpdateRequest` | `MasterProfileResponse` |
| `GET` | `/api/v2/resumes` | List all Resume Views for user | None | `list[ResumeViewSummaryResponse]` |
| `POST` | `/api/v2/resumes` | Create new Resume View from Master | `ResumeViewCreateRequest` | `ResumeViewDetailResponse` |
| `GET` | `/api/v2/resumes/{id}` | Get resolved Resume View (Master + overrides) | None | `ResumeViewDetailResponse` |
| `PUT` | `/api/v2/resumes/{id}` | Update styling, section order, visibility, selection | `ResumeViewUpdateRequest` | `ResumeViewDetailResponse` |
| `PUT` | `/api/v2/resumes/{id}/overrides` | Update tailored content overrides | `ContentOverridesUpdateRequest` | `ResumeViewDetailResponse` |
| `DELETE` | `/api/v2/resumes/{id}` | Delete a Resume View and its versions | None | `{"message": "Resume view deleted"}` |
| `GET` | `/api/v2/resumes/{id}/versions` | List historical versions of resume | None | `list[ResumeVersionSummaryResponse]` |
| `POST` | `/api/v2/resumes/{id}/versions` | Create immutable snapshot | `ResumeVersionCreateRequest` | `ResumeVersionDetailResponse` |
| `POST` | `/api/v2/resumes/{id}/versions/{vid}/restore` | Restore view overrides from snapshot (with auto-checkpoint) | None | `ResumeRestoreResponse` |

### 4.1 Schema Definitions (Pydantic v2)

```python
class SkillItemSchema(BaseModel):
    name: str
    tags: list[str] = Field(default_factory=list)

class BulletItemSchema(BaseModel):
    id: str
    text: str
    tags: list[str] = Field(default_factory=list)

class ExperienceItemSchema(BaseModel):
    id: str
    title: str
    company: str
    location: str = ""
    startDate: str = ""
    endDate: str = ""
    current: bool = False
    bullets: list[BulletItemSchema] = Field(default_factory=list)

class MasterProfileResponse(BaseModel):
    id: UUID
    user_id: str
    personal_info: PersonalInfoSchema
    summary: str
    experience: list[ExperienceItemSchema]
    education: list[EducationItemSchema]
    projects: list[ProjectItemSchema]
    skills: list[SkillItemSchema]
    certifications: list[CertificationItemSchema]
    languages: list[LanguageItemSchema]
    awards: list[AwardItemSchema]
    custom_sections: list[CustomSectionSchema]
    created_at: datetime
    updated_at: datetime

class ResumeViewDetailResponse(BaseModel):
    id: UUID
    user_id: str
    master_profile_id: UUID
    title: str
    template_id: str
    primary_color: str
    font_family: str
    section_order: list[str]
    section_visibility: dict[str, bool]
    selected_entry_ids: dict[str, list[str]]
    content_overrides: dict[str, Any]
    target_job_title: Optional[str]
    target_company: Optional[str]
    resolved_data: dict[str, Any] # Complete rendered data contract
    created_at: datetime
    updated_at: datetime

class ResumeRestoreResponse(BaseModel):
    view: ResumeViewDetailResponse
    pre_restore_checkpoint: ResumeVersionSummaryResponse
```

---

## 5. Service Layer Design

### 5.1 `MasterProfileService`
- **Location**: `backend/app/services/master_profile_service.py`
- **Responsibilities**:
  - `get_or_create_profile(user_id: str) -> MasterProfile`: Fetches existing profile or lazily creates a default one.
  - `update_profile(user_id: str, data: MasterProfileUpdateRequest) -> MasterProfile`: Validates schema, mints missing item UUIDs, and updates `updated_at`.
  - `validate_ownership(profile_id: UUID, user_id: str) -> MasterProfile`: Raises HTTP 404 if profile does not belong to user.

### 5.2 `ResumeViewService` & The Resolution Engine
- **Location**: `backend/app/services/resume_view_service.py`
- **Responsibilities**:
  - `create_view(user_id: str, req: ResumeViewCreateRequest) -> ResumeV2`: Verifies `master_profile_id` belongs to `user_id` (raising 400 if user tries to attach to another user's Master).
  - `update_view(view_id: UUID, user_id: str, req: ResumeViewUpdateRequest) -> ResumeV2`: Enforces ownership before mutating configuration.
  - `apply_overrides(view_id: UUID, user_id: str, overrides: dict) -> ResumeV2`: Deep merges `content_overrides`.
  - `resolve_view_data(view: ResumeV2, master: MasterProfile) -> dict`: **The Resolution Engine**.

#### Concrete Resolution Engine Contract (Input → Output):
```python
# 1. Input: Master Profile
master = {
    "personal_info": {"fullName": "Alex Mercer", "email": "alex@example.com"},
    "summary": "Experienced Full Stack Developer.",
    "experience": [
        {
            "id": "e1",
            "company": "Acme",
            "title": "Engineer",
            "bullets": [{"id": "b1", "text": "Built service X", "tags": ["python"]}]
        },
        {
            "id": "e2",
            "company": "Beta",
            "title": "Senior Engineer",
            "bullets": [{"id": "b2", "text": "Built service Y", "tags": ["go"]}]
        }
    ],
    "skills": [{"name": "Python", "tags": ["backend"]}, {"name": "React", "tags": ["frontend"]}]
}

# 2. Input: View Configuration
view.selected_entry_ids = {"experience": ["e1"]} # e2 filtered out
view.section_visibility = {"summary": True, "experience": True, "skills": False} # skills hidden
view.content_overrides = {
    "summary": "Tailored Backend Architect.",
    "e1": {
        "title": "Lead Software Engineer",
        "bullets": {"b1": "Architected and deployed service X to 1M DAU."}
    }
}

# 3. Output: resolved_data
resolved_data = {
    "personal_info": {"fullName": "Alex Mercer", "email": "alex@example.com"},
    "summary": "Tailored Backend Architect.", // Overridden
    "experience": [
        {
            "id": "e1",
            "company": "Acme",
            "title": "Lead Software Engineer",   // Overridden
            "bullets": [
                {
                    "id": "b1",
                    "text": "Architected and deployed service X to 1M DAU.", // Overridden
                    "tags": ["python"]           // Master tags preserved
                }
            ]
        }
    ],
    // skills omitted because section_visibility["skills"] == False
    "section_order": ["personal", "summary", "experience", ...]
}
```

### 5.3 `ResumeVersionService`
- **Location**: `backend/app/services/resume_version_service.py`
- **Responsibilities**:
  - `create_snapshot(view_id: UUID, user_id: str, label: str, source: str, note: Optional[str]) -> ResumeVersion`:
    1. **Concurrency Serialization**: Locks the parent view row:
       ```sql
       SELECT id FROM resumes_v2 WHERE id = :view_id AND user_id = :user_id FOR UPDATE;
       ```
    2. Resolves snapshot data via `ResumeViewService`.
    3. Computes `next_version = COALESCE(MAX(version_number), 0) + 1 FROM resume_versions WHERE resume_id = :view_id`.
    4. Inserts immutable record into `resume_versions`.
  - `restore_version(view_id: UUID, version_id: UUID, user_id: str) -> tuple[ResumeV2, ResumeVersion]`:
    1. Locks view row `FOR UPDATE`.
    2. **Automatic Checkpoint**: Automatically saves a pre-restore snapshot (`label="Before restore"`, `change_source="restore_checkpoint"`).
    3. Restores view overrides, selection, and styling from `snapshot_data`.
    4. Returns updated view + reference to the pre-restore checkpoint.

---

## 6. Migration Sequence & Zero-Downtime Deployment

```
Step 1: Deploy Alembic Migration 0003
        - Executes DDL (master_profiles, resumes_v2, resume_versions)
        - Executes in-migration data logic inside upgrade() transaction
        (Atomic execution: <100ms on production)
                   │
                   ▼
Step 2: Mount Backend /api/v2/* Router
        New endpoints live; legacy /resume/* endpoints completely untouched
                   │
                   ▼
Step 3: Verification & Parity Checks
        Assert legacy test suite + new v2 integration suite pass 100%
```

---

## 7. Backward Compatibility Contract

- **Legacy Route Preservation**: All routes under `/resume/*` (`/resume/create`, `/resume/list`, `/resume/{id}`, `/resume/{id}/export/*`) remain 100% operational, reading and writing to the `resumes` table.
- **ATS Scorer & AI Services**: Both services continue to accept standard dictionary structures matching `resolved_data`.
- **No Schema Mutations on Legacy Tables**: The legacy `resumes` table is not altered, renamed, or dropped.

---

## 8. Rollback Plan

If unrecoverable defects appear post-deployment:
1. **Pre-Downgrade Data Export**:
   If user activity occurred on v2 tables post-migration, export the v2 data first via SQL dump:
   ```sql
   COPY master_profiles TO STDOUT WITH CSV HEADER;
   COPY resumes_v2 TO STDOUT WITH CSV HEADER;
   COPY resume_versions TO STDOUT WITH CSV HEADER;
   ```
2. **Execute Downgrade**:
   ```powershell
   alembic downgrade 0002_phase_a_auth_and_billing
   ```
3. **Safety Guarantee**:
   The legacy `resumes` table is untouched by the downgrade. Live frontend users continue operating on `/resume/*` with zero downtime or data loss.

---

## 9. Test Plan

To prove Phase B.1 is complete and correct:
1. **In-Migration Parity Test**:
   - Verify existing legacy resumes populate `master_profiles`, `resumes_v2` (preserving `template_name`), and Version 1 snapshots.
   - Assert users with 0 resumes are skipped and lazily initialized on demand.
2. **Cross-User Security & Isolation Tests**:
   - User A creates Master Profile and Resume View $V_A$.
   - Authenticated User B attempts `GET /api/v2/resumes/{V_A}` → **404 Not Found**.
   - Authenticated User B attempts `PUT /api/v2/resumes/{V_A}` → **404 Not Found**.
   - Authenticated User B attempts `PUT /api/v2/resumes/{V_A}/overrides` → **404 Not Found**.
   - Authenticated User B attempts `POST /api/v2/resumes` with `master_profile_id = A_master_id` → **400 Bad Request** (cannot bind view to foreign master).
3. **Concurrency & Race Condition Tests**:
   - Run 10 concurrent requests to `POST /api/v2/resumes/{id}/versions`.
   - Assert all 10 versions receive unique, strictly sequential `version_number`s (1 to 10) with zero duplicate key exceptions.
4. **Resolution Engine Unit Tests**:
   - Verify selection filtering (`selected_entry_ids`).
   - Verify section re-ordering and visibility toggles.
   - Verify bullet-level and section-level `content_overrides` deep merging.
5. **Restore Checkpoint Test**:
   - Verify restoring a version automatically creates a `restore_checkpoint` snapshot enabling full undo.
6. **Legacy Regression Test**:
   - Run complete test suite (`pytest backend/tests`). All legacy `/resume/*` tests must pass 100%.

---

## 10. Open Questions & Alignment

All previous architectural questions have been resolved:
1. **Bullet tags inline JSONB**: Approved without join table; GIN indexing deferred to Phase C.
2. **Legacy multi-resume union**: Approved with B.2 Master Profile curation UI handoff noted in §1.3.
3. **Version pruning**: Deferred; auto-pruning removed from B.1.
