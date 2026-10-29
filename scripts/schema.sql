CREATE TABLE IF NOT EXISTS doctors (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  specialty     TEXT NOT NULL,
  schedule      JSONB NOT NULL,
  slot_minutes  INT  NOT NULL CHECK (slot_minutes > 0)
);

CREATE TABLE IF NOT EXISTS appointments (
  id            SERIAL PRIMARY KEY,
  doctor_id     TEXT NOT NULL REFERENCES doctors(id),
  patient_name  TEXT NOT NULL,
  date          DATE NOT NULL,
  time          TIME NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, date, time)
);