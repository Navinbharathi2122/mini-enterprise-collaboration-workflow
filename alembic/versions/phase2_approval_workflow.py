from alembic import op
import sqlalchemy as sa

revision = "phase2_approval_workflow"
down_revision = "add_updated_by_id"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "approvals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("current_level", sa.String(30), nullable=False, server_default="manager"),
        sa.Column("requested_by_id", sa.Integer(), nullable=False),
        sa.Column("approved_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["requested_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["approved_by_id"], ["users.id"]),
    )

    op.create_table(
        "approval_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("approval_id", sa.Integer(), nullable=False),
        sa.Column("action_by_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(30), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["approval_id"], ["approvals.id"]),
        sa.ForeignKeyConstraint(["action_by_id"], ["users.id"]),
    )


def downgrade():
    op.drop_table("approval_history")
    op.drop_table("approvals")