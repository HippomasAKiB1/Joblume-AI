"""0002_phase_a_auth_and_billing

Revision ID: 0002_phase_a_auth_and_billing
Revises: 0001_initial_baseline
Create Date: 2026-10-20 19:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_phase_a_auth_and_billing'
down_revision: Union[str, Sequence[str], None] = '0001_initial_baseline'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('plan_tier', sa.String(length=50), server_default='free', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('ai_credits_balance', sa.Integer(), server_default='20', nullable=False),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='subscriptions_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='subscriptions_pkey'),
        sa.UniqueConstraint('user_id', name='uq_subscriptions_user')
    )

    # 2. credit_transactions table
    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(length=50), nullable=False),
        sa.Column('reference_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='credit_transactions_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='credit_transactions_pkey')
    )
    op.create_index(
        'idx_credit_transactions_user',
        'credit_transactions',
        ['user_id', sa.text('created_at DESC')],
        unique=False
    )

    # 3. users.refresh_token_hash column
    op.add_column('users', sa.Column('refresh_token_hash', sa.Text(), nullable=True))


def downgrade() -> None:
    # 1. Drop users.refresh_token_hash column
    op.drop_column('users', 'refresh_token_hash')

    # 2. Drop credit_transactions table and index
    op.drop_index('idx_credit_transactions_user', table_name='credit_transactions')
    op.drop_table('credit_transactions')

    # 3. Drop subscriptions table
    op.drop_table('subscriptions')
