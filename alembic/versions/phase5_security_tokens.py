"""Phase 5 refresh and password reset token storage.

Revision ID: phase5_security_tokens
Revises: d82ecc22a130
"""
from alembic import op
import sqlalchemy as sa
revision = "phase5_security_tokens"
down_revision = "d82ecc22a130"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])
    op.create_index("ix_refresh_tokens_revoked_at", "refresh_tokens", ["revoked_at"])
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"])
    op.create_index("ix_password_reset_tokens_token_hash", "password_reset_tokens", ["token_hash"], unique=True)
    op.create_index("ix_password_reset_tokens_expires_at", "password_reset_tokens", ["expires_at"])
    op.create_index("ix_password_reset_tokens_used_at", "password_reset_tokens", ["used_at"])
    op.create_index("ix_tasks_status_priority_created", "tasks", ["status", "priority", "created_at"])
    op.create_index("ix_tasks_assigned_created", "tasks", ["assigned_to_id", "created_at"])
    op.create_index("ix_documents_task_created", "documents", ["task_id", "created_at"])
    op.create_index("ix_documents_uploaded_created", "documents", ["uploaded_by", "created_at"])
    op.create_index("ix_approvals_status_created", "approvals", ["status", "created_at"])
    op.create_index("ix_users_role_name", "users", ["role", "name"])

def downgrade():
    for name, table in [("ix_users_role_name", "users"), ("ix_approvals_status_created", "approvals"), ("ix_documents_uploaded_created", "documents"), ("ix_documents_task_created", "documents"), ("ix_tasks_assigned_created", "tasks"), ("ix_tasks_status_priority_created", "tasks")]:
        op.drop_index(name, table_name=table)
    op.drop_table("password_reset_tokens")
    op.drop_table("refresh_tokens")
