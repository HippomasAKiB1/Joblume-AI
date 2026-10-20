"""0001_initial_baseline

Revision ID: 0001_initial_baseline
Revises:
Create Date: 2026-10-20 19:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_initial_baseline'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('subscription_tier', sa.String(length=50), server_default='free', nullable=True),
        sa.Column('is_admin', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id', name='users_pkey')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. resumes table
    op.create_table(
        'resumes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), server_default='Untitled Resume', nullable=False),
        sa.Column('template_name', sa.String(length=100), server_default='modern-professional', nullable=False),
        sa.Column('json_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='resumes_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='resumes_pkey')
    )

    # 3. applications table
    op.create_table(
        'applications',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('company', sa.String(length=255), nullable=False),
        sa.Column('position', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Applied', nullable=False),
        sa.Column('applied_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='applications_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='applications_pkey')
    )

    # 4. cover_letters table
    op.create_table(
        'cover_letters',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('job_title', sa.String(length=255), nullable=True),
        sa.Column('company_name', sa.String(length=255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='cover_letters_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='cover_letters_pkey')
    )

    # 5. ats_reports table
    op.create_table(
        'ats_reports',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('resume_id', sa.String(length=36), nullable=False),
        sa.Column('score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('suggestions', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], name='ats_reports_resume_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='ats_reports_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='ats_reports_pkey')
    )


def downgrade() -> None:
    op.drop_table('ats_reports')
    op.drop_table('cover_letters')
    op.drop_table('applications')
    op.drop_table('resumes')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
