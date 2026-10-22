"""create documents table"""

from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision = "xxxxxxxxxxxx"          # Keep the generated revision ID
down_revision = "e3d98056241c"     # Merge migration ID
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("tasks.id")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("documents")