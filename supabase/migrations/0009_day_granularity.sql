-- Daily buckets
-- =============
-- The "Total Visitors" card plots a daily series with its own 3-months /
-- 30-days / 7-days control, independent of the page-level granularity. Nothing
-- below `week` existed, and `analytics_bucket_step` actively rejected anything
-- outside its four values, so a 'day' request raised rather than returning an
-- empty series.
--
-- Only the step function changes. `date_trunc` already understands 'day', and
-- `analytics_window_start`, `analytics_bucket_series` and
-- `analytics_viewers_by_bucket` all derive their arithmetic from this function,
-- so they pick up daily buckets without modification.

CREATE OR REPLACE FUNCTION analytics_bucket_step(p_granularity TEXT)
RETURNS INTERVAL AS $$
BEGIN
  IF p_granularity NOT IN ('day', 'week', 'month', 'quarter', 'year') THEN
    RAISE EXCEPTION 'analytics: unsupported granularity %', p_granularity
      USING HINT = 'Expected one of day, week, month, quarter, year';
  END IF;

  RETURN CASE p_granularity
    WHEN 'day'     THEN INTERVAL '1 day'
    WHEN 'week'    THEN INTERVAL '1 week'
    WHEN 'month'   THEN INTERVAL '1 month'
    -- 'quarter' is a valid date_trunc unit but not a valid interval unit.
    WHEN 'quarter' THEN INTERVAL '3 months'
    WHEN 'year'    THEN INTERVAL '1 year'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
