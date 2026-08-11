-- Period-over-period comparison for the interest breakdown
-- ========================================================
-- The dashboard's per-chart insight moved from "which category leads right
-- now" to "which category is growing or shrinking". That is a question about
-- two windows, and `analytics_interest_breakdown` could only ever describe one:
-- it derived its window from now() with no way to ask for an earlier stretch.
--
-- This adds `p_offset_buckets`, which slides the whole window back by N buckets
-- while keeping its length. Passing the bucket count as the offset yields
-- exactly the window immediately before the current one, which is the
-- comparison the growth figures are built on.
--
-- The old four-argument function has to be dropped rather than replaced.
-- CREATE OR REPLACE only matches an identical argument list, so adding a
-- defaulted fifth parameter would leave both versions resident and make a
-- four-argument call ambiguous ("function is not unique").

DROP FUNCTION IF EXISTS analytics_interest_breakdown(TEXT, INT, TEXT, INT);

CREATE OR REPLACE FUNCTION analytics_interest_breakdown(
  p_granularity TEXT DEFAULT 'month',
  p_buckets INT DEFAULT 12,
  p_tz TEXT DEFAULT 'Australia/Melbourne',
  p_limit INT DEFAULT 12,
  -- 0 is the window ending with the current bucket. Passing p_buckets gives
  -- the equal-length window immediately before it.
  p_offset_buckets INT DEFAULT 0
)
RETURNS TABLE (dimension TEXT, label TEXT, events BIGINT, visitors BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      -- Both edges are plain timestamptz constants so the range stays
      -- index-sargable against idx_analytics_events_occurred_at; wrapping
      -- occurred_at in date_trunc here would force a sequential scan.
      (
        date_trunc(p_granularity, (now() AT TIME ZONE p_tz))
          - (GREATEST(p_buckets, 1) - 1 + GREATEST(p_offset_buckets, 0))
            * analytics_bucket_step(p_granularity)
      ) AT TIME ZONE p_tz AS window_start,
      (
        date_trunc(p_granularity, (now() AT TIME ZONE p_tz))
          - (GREATEST(p_offset_buckets, 0) - 1)
            * analytics_bucket_step(p_granularity)
      ) AT TIME ZONE p_tz AS window_end
  ),
  scoped AS (
    SELECT e.visitor_id, e.job_type, e.tags
    FROM analytics_events e, bounds b
    WHERE e.occurred_at >= b.window_start
      AND e.occurred_at < b.window_end
  ),
  by_type AS (
    SELECT
      'job_type'::TEXT AS dimension,
      s.job_type AS label,
      COUNT(*)::BIGINT AS events,
      COUNT(DISTINCT s.visitor_id)::BIGINT AS visitors
    FROM scoped s
    WHERE s.job_type IS NOT NULL
    GROUP BY s.job_type
  ),
  by_tag AS (
    SELECT
      'tag'::TEXT AS dimension,
      t.tag AS label,
      COUNT(*)::BIGINT AS events,
      COUNT(DISTINCT s.visitor_id)::BIGINT AS visitors
    FROM scoped s
    CROSS JOIN LATERAL unnest(s.tags) AS t(tag)
    WHERE s.tags IS NOT NULL
    GROUP BY t.tag
  ),
  ranked AS (
    SELECT
      u.*,
      ROW_NUMBER() OVER (
        PARTITION BY u.dimension
        ORDER BY u.events DESC, u.label ASC
      ) AS rn
    FROM (SELECT * FROM by_type UNION ALL SELECT * FROM by_tag) u
  )
  SELECT r.dimension, r.label, r.events, r.visitors
  FROM ranked r
  WHERE r.rn <= GREATEST(p_limit, 1)
  ORDER BY r.dimension, r.events DESC, r.label ASC;
$$;

REVOKE EXECUTE ON FUNCTION analytics_interest_breakdown(TEXT, INT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION analytics_interest_breakdown(TEXT, INT, TEXT, INT, INT)
  TO authenticated, service_role;
