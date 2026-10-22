from alembic import op
import sqlalchemy as sa


revision = "create_comments_table"
down_revision = "add_updated_by_id"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "comments",

        sa.Column("id", sa.Integer(), primary_key=True),

        sa.Column(
            "task_id",
            sa.Integer(),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),

        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "is_internal",
            sa.Boolean(),
            nullable=False,
            server_default="0",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
    )


def downgrade():
    op.drop_table("comments")