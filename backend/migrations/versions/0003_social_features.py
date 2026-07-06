"""social features: friends, chats, messages, places

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-06
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE friends (
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            friend_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, friend_id),
            CHECK (user_id <> friend_id)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE friend_requests (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            CHECK (from_user_id <> to_user_id)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE chats (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            type text NOT NULL CHECK (type IN ('event', 'direct')),
            name text NOT NULL,
            event_id uuid REFERENCES activities(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            deleted_at timestamptz
        )
        """
    )

    op.execute(
        """
        CREATE TABLE chat_members (
            chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role text NOT NULL DEFAULT 'member'
                CHECK (role IN ('admin', 'member')),
            joined_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (chat_id, user_id)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE messages (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            text text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )

    # Trigger: auto-create event chat when activity is created
    op.execute(
        """
        CREATE FUNCTION activities_create_chat()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_chat_id uuid;
        BEGIN
            INSERT INTO chats (type, name, event_id)
            VALUES ('event', NEW.title, NEW.id)
            RETURNING id INTO new_chat_id;

            INSERT INTO chat_members (chat_id, user_id, role)
            VALUES (new_chat_id, NEW.organizer_id, 'admin');

            RETURN NEW;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_activities_create_chat
        AFTER INSERT ON activities
        FOR EACH ROW
        EXECUTE FUNCTION activities_create_chat()
        """
    )

    # Trigger: add participant to event chat when they join
    op.execute(
        """
        CREATE FUNCTION activity_participants_add_to_chat()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            INSERT INTO chat_members (chat_id, user_id, role)
            SELECT c.id, NEW.user_id, 'member'
            FROM chats c
            WHERE c.event_id = NEW.activity_id
              AND c.deleted_at IS NULL
              AND c.type = 'event'
            ON CONFLICT (chat_id, user_id) DO NOTHING;

            RETURN NEW;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_activity_participants_add_to_chat
        AFTER INSERT ON activity_participants
        FOR EACH ROW
        EXECUTE FUNCTION activity_participants_add_to_chat()
        """
    )

    # Trigger: remove participant from event chat when they leave
    op.execute(
        """
        CREATE FUNCTION activity_participants_remove_from_chat()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            DELETE FROM chat_members
            WHERE chat_id IN (SELECT id FROM chats WHERE event_id = OLD.activity_id AND type = 'event')
              AND user_id = OLD.user_id
              AND role = 'member';

            RETURN OLD;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_activity_participants_remove_from_chat
        AFTER DELETE ON activity_participants
        FOR EACH ROW
        EXECUTE FUNCTION activity_participants_remove_from_chat()
        """
    )

    # Trigger: auto-notify organizer when someone joins
    op.execute(
        """
        CREATE FUNCTION activity_participants_notify_organizer()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            INSERT INTO notifications (user_id, activity_id, type, title, body, payload)
            SELECT a.organizer_id, NEW.activity_id, 'join',
                   'Новый участник',
                   u.name || ' присоединился к «' || a.title || '»',
                   jsonb_build_object('user_id', NEW.user_id, 'user_name', u.name)
            FROM activities a
            JOIN users u ON u.id = NEW.user_id
            WHERE a.id = NEW.activity_id
              AND a.organizer_id <> NEW.user_id;

            RETURN NEW;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_activity_participants_notify_organizer
        AFTER INSERT ON activity_participants
        FOR EACH ROW
        EXECUTE FUNCTION activity_participants_notify_organizer()
        """
    )

    op.execute(
        """
        CREATE TABLE user_places (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name text NOT NULL,
            image_url text,
            location geography(Point, 4326),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )

    op.execute("CREATE UNIQUE INDEX ux_friend_requests_pair ON friend_requests (from_user_id, to_user_id) WHERE status = 'pending'")
    op.execute("CREATE INDEX ix_friend_requests_to_user ON friend_requests (to_user_id) WHERE status = 'pending'")
    op.execute("CREATE INDEX ix_friends_user ON friends (user_id)")
    op.execute("CREATE INDEX ix_friends_friend ON friends (friend_id)")
    op.execute("CREATE INDEX ix_chats_event ON chats (event_id) WHERE event_id IS NOT NULL AND deleted_at IS NULL")
    op.execute("CREATE INDEX ix_chat_members_user ON chat_members (user_id)")
    op.execute("CREATE INDEX ix_chat_members_chat ON chat_members (chat_id)")
    op.execute("CREATE INDEX ix_messages_chat_time ON messages (chat_id, created_at DESC)")
    op.execute("CREATE INDEX ix_user_places_user ON user_places (user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_places")
    op.execute("DROP TRIGGER IF EXISTS trg_activity_participants_notify_organizer ON activity_participants")
    op.execute("DROP FUNCTION IF EXISTS activity_participants_notify_organizer")
    op.execute("DROP TRIGGER IF EXISTS trg_activity_participants_remove_from_chat ON activity_participants")
    op.execute("DROP FUNCTION IF EXISTS activity_participants_remove_from_chat")
    op.execute("DROP TRIGGER IF EXISTS trg_activity_participants_add_to_chat ON activity_participants")
    op.execute("DROP FUNCTION IF EXISTS activity_participants_add_to_chat")
    op.execute("DROP TRIGGER IF EXISTS trg_activities_create_chat ON activities")
    op.execute("DROP FUNCTION IF EXISTS activities_create_chat")
    op.execute("DROP TABLE IF EXISTS messages")
    op.execute("DROP TABLE IF EXISTS chat_members")
    op.execute("DROP TABLE IF EXISTS chats")
    op.execute("DROP TABLE IF EXISTS friend_requests")
    op.execute("DROP TABLE IF EXISTS friends")
