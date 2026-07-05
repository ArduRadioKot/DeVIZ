"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-01
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.execute(
        """
        CREATE TABLE cities (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            name text NOT NULL,
            region text,
            country_code text NOT NULL DEFAULT 'RU'
                CHECK (char_length(country_code) = 2),
            timezone text NOT NULL,
            center geography(Point, 4326) NOT NULL,
            boundary geometry(MultiPolygon, 4326),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )

    op.execute(
        """
        CREATE TABLE users (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            email text NOT NULL,
            password_hash text NOT NULL,
            name text NOT NULL,
            avatar_url text,
            city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
            timezone text NOT NULL DEFAULT 'Europe/Moscow',
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            deleted_at timestamptz
        )
        """
    )

    op.execute(
        """
        CREATE TABLE activities (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            organizer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            city_id uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
            title text NOT NULL,
            description text,
            category text NOT NULL,
            level text NOT NULL DEFAULT 'any'
                CHECK (level IN ('any', 'beginner', 'amateur', 'confident')),
            address text NOT NULL,
            location geography(Point, 4326) NOT NULL,
            timezone text NOT NULL,
            start_at timestamptz NOT NULL,
            duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
            join_deadline timestamptz NOT NULL,
            min_participants integer NOT NULL CHECK (min_participants > 0),
            max_participants integer NOT NULL CHECK (max_participants > 0),
            current_participants_count integer NOT NULL DEFAULT 0,
            price_amount integer CHECK (price_amount IS NULL OR price_amount >= 0),
            status text NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'confirmed', 'full', 'cancelled', 'expired', 'completed')),
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            deleted_at timestamptz,
            CHECK (max_participants >= min_participants),
            CHECK (current_participants_count >= 0),
            CHECK (current_participants_count <= max_participants),
            CHECK (join_deadline <= start_at)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE activity_participants (
            activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role text NOT NULL DEFAULT 'participant'
                CHECK (role IN ('organizer', 'participant')),
            joined_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (activity_id, user_id)
        )
        """
    )

    op.execute(
        """
        CREATE FUNCTION activity_participants_before_insert()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        DECLARE
            activity_status text;
            activity_deleted_at timestamptz;
            activity_join_deadline timestamptz;
            activity_min_participants integer;
            activity_max_participants integer;
            activity_current_participants_count integer;
        BEGIN
            SELECT status,
                   deleted_at,
                   join_deadline,
                   min_participants,
                   max_participants,
                   current_participants_count
            INTO activity_status,
                 activity_deleted_at,
                 activity_join_deadline,
                 activity_min_participants,
                 activity_max_participants,
                 activity_current_participants_count
            FROM activities
            WHERE id = NEW.activity_id
            FOR UPDATE;

            IF activity_status IS NULL THEN
                RAISE EXCEPTION 'activity not found'
                    USING ERRCODE = '23503';
            END IF;

            IF activity_deleted_at IS NOT NULL THEN
                RAISE EXCEPTION 'activity is deleted'
                    USING ERRCODE = '23514';
            END IF;

            IF activity_current_participants_count >= activity_max_participants THEN
                RAISE EXCEPTION 'activity is full'
                    USING ERRCODE = '23514';
            END IF;

            IF NEW.role <> 'organizer' THEN
                IF activity_status NOT IN ('open', 'confirmed') OR activity_join_deadline < now() THEN
                    RAISE EXCEPTION 'activity is closed or expired'
                        USING ERRCODE = '23514';
                END IF;
            END IF;

            UPDATE activities
            SET current_participants_count = current_participants_count + 1,
                status = CASE
                    WHEN NEW.role = 'organizer' AND status NOT IN ('open', 'confirmed', 'full') THEN status
                    WHEN current_participants_count + 1 >= max_participants THEN 'full'
                    WHEN current_participants_count + 1 >= min_participants THEN 'confirmed'
                    ELSE status
                END,
                updated_at = now()
            WHERE id = NEW.activity_id;

            RETURN NEW;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE FUNCTION activity_participants_after_delete()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            UPDATE activities
            SET current_participants_count = GREATEST(current_participants_count - 1, 0),
                status = CASE
                    WHEN status IN ('open', 'confirmed', 'full') AND join_deadline >= now() THEN
                        CASE
                            WHEN GREATEST(current_participants_count - 1, 0) >= max_participants THEN 'full'
                            WHEN GREATEST(current_participants_count - 1, 0) >= min_participants THEN 'confirmed'
                            ELSE 'open'
                        END
                    ELSE status
                END,
                updated_at = now()
            WHERE id = OLD.activity_id;

            RETURN OLD;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_activity_participants_before_insert
        BEFORE INSERT ON activity_participants
        FOR EACH ROW
        EXECUTE FUNCTION activity_participants_before_insert()
        """
    )

    op.execute(
        """
        CREATE FUNCTION activities_after_insert()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            INSERT INTO activity_participants (activity_id, user_id, role)
            VALUES (NEW.id, NEW.organizer_id, 'organizer');

            RETURN NEW;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_activities_after_insert
        AFTER INSERT ON activities
        FOR EACH ROW
        EXECUTE FUNCTION activities_after_insert()
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_activity_participants_after_delete
        AFTER DELETE ON activity_participants
        FOR EACH ROW
        EXECUTE FUNCTION activity_participants_after_delete()
        """
    )

    op.execute(
        """
        CREATE TABLE notifications (
            id uuid PRIMARY KEY DEFAULT uuidv7(),
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
            type text NOT NULL,
            title text NOT NULL,
            body text,
            payload jsonb NOT NULL DEFAULT '{}'::jsonb,
            read_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )

    op.execute("CREATE UNIQUE INDEX ux_cities_country_region_name ON cities (country_code, name, (COALESCE(region, '')))")
    op.execute("CREATE INDEX ix_cities_center ON cities USING gist (center)")
    op.execute("CREATE INDEX ix_cities_boundary ON cities USING gist (boundary)")
    op.execute("CREATE UNIQUE INDEX ux_users_email_active ON users (lower(email)) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX ix_users_city ON users (city_id)")
    op.execute("CREATE INDEX ix_activities_location ON activities USING gist (location)")
    op.execute("CREATE INDEX ix_activities_city_start ON activities (city_id, start_at)")
    op.execute("CREATE INDEX ix_activities_status_start ON activities (status, start_at)")
    op.execute("CREATE INDEX ix_activities_expirable ON activities (join_deadline) WHERE status IN ('open', 'confirmed')")
    op.execute("CREATE INDEX ix_activities_category ON activities (category)")
    op.execute("CREATE INDEX ix_activity_participants_user ON activity_participants (user_id)")
    op.execute("CREATE INDEX ix_notifications_user_id ON notifications (user_id, id DESC)")
    op.execute("CREATE INDEX ix_notifications_user_unread ON notifications (user_id) WHERE read_at IS NULL")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notifications")
    op.execute("DROP TRIGGER IF EXISTS trg_activities_after_insert ON activities")
    op.execute("DROP FUNCTION IF EXISTS activities_after_insert")
    op.execute("DROP TRIGGER IF EXISTS trg_activity_participants_after_delete ON activity_participants")
    op.execute("DROP TRIGGER IF EXISTS trg_activity_participants_before_insert ON activity_participants")
    op.execute("DROP TRIGGER IF EXISTS trg_activity_participants_after_insert ON activity_participants")
    op.execute("DROP FUNCTION IF EXISTS activity_participants_after_delete")
    op.execute("DROP FUNCTION IF EXISTS activity_participants_before_insert")
    op.execute("DROP FUNCTION IF EXISTS activity_participants_after_insert")
    op.execute("DROP TABLE IF EXISTS activity_participants")
    op.execute("DROP TABLE IF EXISTS activities")
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("DROP TABLE IF EXISTS cities")
