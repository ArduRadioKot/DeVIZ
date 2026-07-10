"""user devices

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-02
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE user_devices (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
            push_token text NOT NULL,
            device_name text,
            app_version text,
            last_seen_at timestamptz NOT NULL DEFAULT now(),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            deleted_at timestamptz
        )
        """
    )
    op.execute("CREATE INDEX ix_user_devices_user ON user_devices (user_id) WHERE deleted_at IS NULL")
    op.execute("CREATE UNIQUE INDEX ux_user_devices_push_token_active ON user_devices (push_token) WHERE deleted_at IS NULL")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_devices")
