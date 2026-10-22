"""0003_master_profile_hierarchy

Revision ID: 0003_master_profile_hierarchy
Revises: 0002_phase_a_auth_and_billing
Create Date: 2026-10-22 15:30:00.000000

"""
from typing import Sequence, Union
import json
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0003_master_profile_hierarchy'
down_revision: Union[str, Sequence[str], None] = '0002_phase_a_auth_and_billing'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Create master_profiles table ──────────────────────────────
    op.create_table(
        'master_profiles',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column(
            'personal_info',
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text(
                r"""'{"fullName":"","email":"","phone":"","location":"","website":"","linkedin":"","github":"","portfolio":"","photo_url"\:null}'::jsonb"""
            ),
            nullable=False
        ),
        sa.Column('summary', sa.Text(), server_default='', nullable=False),
        sa.Column('experience', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('education', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('projects', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('skills', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('certifications', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('languages', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('awards', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('custom_sections', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'[]\'::jsonb'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_master_profiles_user', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='master_profiles_pkey'),
        sa.UniqueConstraint('user_id', name='uq_master_profiles_user')
    )
    op.create_index('idx_master_profiles_user_id', 'master_profiles', ['user_id'], unique=False)

    # ── 2. Create resumes_v2 table ───────────────────────────────────
    op.create_table(
        'resumes_v2',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('master_profile_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), server_default='Untitled Resume', nullable=False),
        sa.Column('template_id', sa.String(length=100), server_default='modern-professional', nullable=False),
        sa.Column('primary_color', sa.String(length=30), server_default='#4F46E5', nullable=False),
        sa.Column('font_family', sa.String(length=50), server_default='Inter', nullable=False),
        sa.Column(
            'section_order',
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text(
                '\'["personal","summary","experience","education","skills","projects",'
                '"certifications","languages","awards","custom_sections"]\'::jsonb'
            ),
            nullable=False
        ),
        sa.Column(
            'section_visibility',
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text(
                r"""'{"personal"\:true,"summary"\:true,"experience"\:true,"education"\:true,"skills"\:true,"projects"\:true,"certifications"\:true,"languages"\:true,"awards"\:true,"custom_sections"\:true}'::jsonb"""
            ),
            nullable=False
        ),
        sa.Column('selected_entry_ids', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'{}\'::jsonb'), nullable=False),
        sa.Column('content_overrides', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text('\'{}\'::jsonb'), nullable=False),
        sa.Column('target_job_title', sa.String(length=255), nullable=True),
        sa.Column('target_company', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['master_profile_id'], ['master_profiles.id'], name='fk_resumes_v2_master', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_resumes_v2_user', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='resumes_v2_pkey')
    )
    op.create_index('idx_resumes_v2_user_id', 'resumes_v2', ['user_id'], unique=False)
    op.create_index('idx_resumes_v2_master_id', 'resumes_v2', ['master_profile_id'], unique=False)

    # ── 3. Create resume_versions table ──────────────────────────────
    op.create_table(
        'resume_versions',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('resume_id', sa.UUID(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), server_default='Manual Save', nullable=False),
        sa.Column('change_source', sa.String(length=50), server_default='manual', nullable=False),
        sa.Column('snapshot_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes_v2.id'], name='fk_resume_versions_resume', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='resume_versions_pkey'),
        sa.UniqueConstraint('resume_id', 'version_number', name='uq_resume_version_number')
    )
    op.create_index(
        'idx_resume_versions_resume_id',
        'resume_versions',
        ['resume_id', sa.text('version_number DESC')],
        unique=False
    )

    # ── 4. Add resume_version_id column to applications table ────────
    op.add_column('applications', sa.Column('resume_version_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_applications_resume_version',
        'applications',
        'resume_versions',
        ['resume_version_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # ── 5. In-migration data logic for existing legacy resumes ───────
    bind = op.get_bind()
    _migrate_legacy_resumes_data(bind)


def _normalize_bullets(raw_bullets):
    """Ensure bullets are structured objects with id, text, tags."""
    if not isinstance(raw_bullets, list):
        return []
    normalized = []
    for b in raw_bullets:
        if isinstance(b, str):
            normalized.append({"id": str(uuid.uuid4()), "text": b, "tags": []})
        elif isinstance(b, dict):
            b_copy = dict(b)
            if "id" not in b_copy or not b_copy["id"]:
                b_copy["id"] = str(uuid.uuid4())
            if "tags" not in b_copy or not isinstance(b_copy["tags"], list):
                b_copy["tags"] = []
            normalized.append(b_copy)
    return normalized


def _normalize_skills(raw_skills):
    """Ensure skills are structured objects with name and tags."""
    if not isinstance(raw_skills, list):
        return []
    normalized = []
    for s in raw_skills:
        if isinstance(s, str):
            normalized.append({"name": s, "tags": []})
        elif isinstance(s, dict):
            s_copy = dict(s)
            if "name" not in s_copy:
                continue
            if "tags" not in s_copy or not isinstance(s_copy["tags"], list):
                s_copy["tags"] = []
            normalized.append(s_copy)
    return normalized


def _normalize_list_items(items):
    """Ensure each item in a list has an id UUID."""
    if not isinstance(items, list):
        return []
    normalized = []
    for item in items:
        if isinstance(item, dict):
            item_copy = dict(item)
            if "id" not in item_copy or not item_copy["id"]:
                item_copy["id"] = str(uuid.uuid4())
            normalized.append(item_copy)
    return normalized


def _migrate_legacy_resumes_data(bind) -> None:
    """Migrates existing legacy resumes to master_profiles, resumes_v2, and resume_versions."""
    # Query all legacy resumes ordered by user_id and updated_at desc
    raw_resumes = bind.execute(
        sa.text("SELECT id, user_id, title, template_name, json_data, created_at, updated_at FROM resumes ORDER BY user_id, updated_at DESC")
    ).fetchall()

    if not raw_resumes:
        return

    # Group resumes by user_id
    users_resumes = {}
    for row in raw_resumes:
        uid = str(row[1])
        users_resumes.setdefault(uid, []).append(row)

    for user_id, resume_list in users_resumes.items():
        base_row = resume_list[0]
        base_data = base_row[4]
        if isinstance(base_data, str):
            try:
                base_data = json.loads(base_data)
            except Exception:
                base_data = {}
        elif not isinstance(base_data, dict):
            base_data = {}

        personal_info = base_data.get("personalInfo", {})
        if not isinstance(personal_info, dict):
            personal_info = {}
        for key in ["fullName", "email", "phone", "location", "website", "linkedin", "github", "portfolio"]:
            personal_info.setdefault(key, "")
        personal_info.setdefault("photo_url", None)

        summary = base_data.get("summary", "") or ""
        experience = _normalize_list_items(base_data.get("experience", []))
        for exp in experience:
            exp["bullets"] = _normalize_bullets(exp.get("bullets", []))

        education = _normalize_list_items(base_data.get("education", []))
        projects = _normalize_list_items(base_data.get("projects", []))
        skills = _normalize_skills(base_data.get("skills", []))
        certifications = _normalize_list_items(base_data.get("certifications", []))
        languages = _normalize_list_items(base_data.get("languages", []))
        awards = _normalize_list_items(base_data.get("awards", []))
        custom_sections = _normalize_list_items(base_data.get("customSections", []))

        # Union distinct items from older resumes
        for older_row in resume_list[1:]:
            older_data = older_row[4]
            if isinstance(older_data, str):
                try:
                    older_data = json.loads(older_data)
                except Exception:
                    older_data = {}
            if not isinstance(older_data, dict):
                continue

            # Experience union by (company, title, startDate)
            existing_exp_keys = {
                (e.get("company", "").strip().lower(), e.get("title", "").strip().lower(), e.get("startDate", "").strip())
                for e in experience
            }
            for exp in _normalize_list_items(older_data.get("experience", [])):
                key = (exp.get("company", "").strip().lower(), exp.get("title", "").strip().lower(), exp.get("startDate", "").strip())
                if key not in existing_exp_keys:
                    exp["bullets"] = _normalize_bullets(exp.get("bullets", []))
                    experience.append(exp)
                    existing_exp_keys.add(key)

            # Education union by (institution, degree)
            existing_edu_keys = {
                (ed.get("institution", "").strip().lower(), ed.get("degree", "").strip().lower())
                for ed in education
            }
            for ed in _normalize_list_items(older_data.get("education", [])):
                key = (ed.get("institution", "").strip().lower(), ed.get("degree", "").strip().lower())
                if key not in existing_edu_keys:
                    education.append(ed)
                    existing_edu_keys.add(key)

            # Projects union by name
            existing_proj_keys = {p.get("name", "").strip().lower() for p in projects}
            for p in _normalize_list_items(older_data.get("projects", [])):
                name_key = p.get("name", "").strip().lower()
                if name_key not in existing_proj_keys:
                    projects.append(p)
                    existing_proj_keys.add(name_key)

            # Skills union by name
            existing_skill_keys = {s.get("name", "").strip().lower() for s in skills}
            for s in _normalize_skills(older_data.get("skills", [])):
                name_key = s.get("name", "").strip().lower()
                if name_key not in existing_skill_keys:
                    skills.append(s)
                    existing_skill_keys.add(name_key)

        # Insert master_profile row
        master_profile_id = str(uuid.uuid4())
        bind.execute(
            sa.text("""
                INSERT INTO master_profiles (
                    id, user_id, personal_info, summary, experience, education,
                    projects, skills, certifications, languages, awards,
                    custom_sections, created_at, updated_at
                ) VALUES (
                    :id, :user_id, :personal_info, :summary, :experience, :education,
                    :projects, :skills, :certifications, :languages, :awards,
                    :custom_sections, NOW(), NOW()
                )
            """),
            {
                "id": master_profile_id,
                "user_id": user_id,
                "personal_info": json.dumps(personal_info),
                "summary": summary,
                "experience": json.dumps(experience),
                "education": json.dumps(education),
                "projects": json.dumps(projects),
                "skills": json.dumps(skills),
                "certifications": json.dumps(certifications),
                "languages": json.dumps(languages),
                "awards": json.dumps(awards),
                "custom_sections": json.dumps(custom_sections),
            }
        )

        # Insert resumes_v2 and resume_versions for each legacy resume
        for r_row in resume_list:
            res_id = str(uuid.uuid4())
            title = r_row[2] or "Untitled Resume"
            template_id = r_row[3] or "modern-professional"
            r_json = r_row[4]
            if isinstance(r_json, str):
                try:
                    r_json = json.loads(r_json)
                except Exception:
                    r_json = {}
            elif not isinstance(r_json, dict):
                r_json = {}

            # Create Resume View
            default_sec_order = json.dumps([
                "personal", "summary", "experience", "education", "skills",
                "projects", "certifications", "languages", "awards", "custom_sections"
            ])
            default_sec_vis = json.dumps({
                "personal": True, "summary": True, "experience": True, "education": True,
                "skills": True, "projects": True, "certifications": True, "languages": True,
                "awards": True, "custom_sections": True
            })
            bind.execute(
                sa.text("""
                    INSERT INTO resumes_v2 (
                        id, user_id, master_profile_id, title, template_id,
                        primary_color, font_family, section_order, section_visibility,
                        selected_entry_ids, content_overrides, created_at, updated_at
                    ) VALUES (
                        :id, :user_id, :master_profile_id, :title, :template_id,
                        '#4F46E5', 'Inter',
                        :section_order, :section_visibility,
                        '{}'::jsonb, '{}'::jsonb, NOW(), NOW()
                    )
                """),
                {
                    "id": res_id,
                    "user_id": user_id,
                    "master_profile_id": master_profile_id,
                    "title": title,
                    "template_id": template_id,
                    "section_order": default_sec_order,
                    "section_visibility": default_sec_vis,
                }
            )

            # Create Version 1 snapshot
            ver_id = str(uuid.uuid4())
            bind.execute(
                sa.text("""
                    INSERT INTO resume_versions (
                        id, resume_id, version_number, label, change_source,
                        snapshot_data, note, created_at
                    ) VALUES (
                        :id, :resume_id, 1, 'Initial Migration', 'migration',
                        :snapshot_data, 'Migrated from legacy resume', NOW()
                    )
                """),
                {
                    "id": ver_id,
                    "resume_id": res_id,
                    "snapshot_data": json.dumps(r_json),
                }
            )


def downgrade() -> None:
    # 1. Drop foreign key and column on applications
    op.drop_constraint('fk_applications_resume_version', 'applications', type_='foreignkey')
    op.drop_column('applications', 'resume_version_id')

    # 2. Drop resume_versions
    op.drop_index('idx_resume_versions_resume_id', table_name='resume_versions')
    op.drop_table('resume_versions')

    # 3. Drop resumes_v2
    op.drop_index('idx_resumes_v2_master_id', table_name='resumes_v2')
    op.drop_index('idx_resumes_v2_user_id', table_name='resumes_v2')
    op.drop_table('resumes_v2')

    # 4. Drop master_profiles
    op.drop_index('idx_master_profiles_user_id', table_name='master_profiles')
    op.drop_table('master_profiles')
