"""merge phase2 heads

Revision ID: e3d98056241c
Revises: create_comments_table, phase2_approval_workflow
Create Date: 2026-09-19 03:29:42.237309

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3d98056241c'
down_revision: Union[str, Sequence[str], None] = ('create_comments_table', 'phase2_approval_workflow')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
