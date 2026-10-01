-- Migration: Automatic Daily Digest Cron Job at 10:00 PM BST (16:00 UTC)
-- Description: Schedules an automated HTTP GET request to /api/cron-daily-digest every day at 16:00 UTC using pg_cron and pg_net.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Unschedule previous job if exists to avoid duplication
SELECT cron.unschedule('daily-digest-telegram-10pm') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-digest-telegram-10pm'
);

-- Schedule Daily Digest Report at 10:00 PM BST (16:00 UTC) every day
SELECT cron.schedule(
  'daily-digest-telegram-10pm',
  '0 16 * * *',
  $$
  SELECT net.http_get(
    url := 'https://industrymentor.net/api/cron-daily-digest'
  );
  $$
);
