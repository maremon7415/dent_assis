-- Integrity rules Prisma's schema language cannot express. Idempotent: safe to run after every `db push`.
-- Run with: npm run db:constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_rating_range') THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctor_schedules_weekday_range') THEN
    ALTER TABLE doctor_schedules ADD CONSTRAINT doctor_schedules_weekday_range CHECK (weekday BETWEEN 0 AND 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctor_schedules_time_order') THEN
    ALTER TABLE doctor_schedules ADD CONSTRAINT doctor_schedules_time_order
      CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$|^24:00$' AND "startTime" < "endTime");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctor_time_off_order') THEN
    ALTER TABLE doctor_time_off ADD CONSTRAINT doctor_time_off_order CHECK ("endsAt" > "startsAt");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_time_order') THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_time_order
      CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_price_nonnegative') THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_price_nonnegative CHECK ("priceCents" IS NULL OR "priceCents" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_values_valid') THEN
    ALTER TABLE services ADD CONSTRAINT services_values_valid CHECK ("priceCents" >= 0 AND "durationMinutes" > 0);
  END IF;
  -- An active appointment (PENDING/CONFIRMED) created through the app always holds its slot.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_released_slot') THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_released_slot
      CHECK ("slotKey" IS NULL OR status IN ('PENDING', 'CONFIRMED', 'COMPLETED'));
  END IF;
END $$;
