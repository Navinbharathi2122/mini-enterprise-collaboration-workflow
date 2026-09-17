from alembic import op
import sqlalchemy as sa

revision = "add_updated_by_id"
down_revision = "3a925025ddab"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tasks",
        sa.Column("updated_by_id", sa.Integer(), nullable=True),
    )

    op.create_foreign_key(
        "fk_tasks_updated_by",
        "tasks",
        "users",
        ["updated_by_id"],
        ["id"],
    )


def downgrade():
    op.drop_constraint(
        "fk_tasks_updated_by",
        "tasks",
        type_="foreignkey",
    )

    op.drop_column("tasks", "updated_by_id")