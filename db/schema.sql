CREATE TABLE IF NOT EXISTS entries (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT        NOT NULL,
  message       TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  password_salt TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries (created_at DESC);
