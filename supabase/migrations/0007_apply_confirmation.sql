-- Confirmed applications
-- ======================
-- Adds a fifth event type, `apply_confirmed`.
--
-- `apply` only ever meant "left for the employer's site" — the application
-- itself happens somewhere this system cannot see. This event records the one
-- signal we can honestly get: the visitor came back and said they finished.
--
-- It is a lower bound by construction. Someone who applies and never returns to
-- the board is never counted, so `apply_confirmed` should be read as "at least
-- this many", never as a complete total. The dashboard shows it alongside the
-- apply-click count for exactly that reason.

ALTER TABLE analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN ('view', 'click', 'apply', 'apply_confirmed', 'share'));
