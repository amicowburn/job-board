-- User Analytics: event tracking + aggregation
-- =============================================
-- Adds the first tracking infrastructure to the job board. Before this
-- migration there was no events table, no view counters, and no visitor
-- identity of any kind.
--
-- Job seekers are anonymous by construction (there is no public user table and
-- no sign-up flow), so "viewers" means distinct anonymous visitors, identified
-- by the first-party `mmss_vid` cookie set in middleware.

-- =====================
-- TABLES
-- =====================

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'apply', 'share')),
  -- SET NULL rather than CASCADE: deleting a job must not erase the engagement
  -- history it generated. The denormalized columns below keep those orphaned
  -- rows meaningful.
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  visitor_id UUID NOT NULL,
  -- Snapshots of the job at event time, written by the trigger below rather
  -- than by the client. Two reasons: the interest breakdown never has to join
  -- `jobs`, and re-tagging or deleting a job later cannot rewrite history.
  job_type TEXT,
  tags TEXT[],
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
-- Every dashboard query starts with a bounded `occurred_at >= <window start>`
-- filter, so these keep the aggregations to a range scan over the requested
-- window rather than a scan of the whole table.

-- The window filter shared by all three aggregation functions.
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at
  ON analytics_events (occurred_at DESC);

-- The per-action counters (clicked / applied / shared).
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_occurred_at
  ON analytics_events (event_type, occurred_at DESC);

-- Distinct-viewer-per-bucket can run as an index-only scan off this one.
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at_visitor
  ON analytics_events (occurred_at, visitor_id);

-- Interest breakdown by tag.
CREATE INDEX IF NOT EXISTS idx_analytics_events_tags
  ON analytics_events USING GIN (tags);

-- Per-job drilldowns, and the FK's own lookups on job delete.
CREATE INDEX IF NOT EXISTS idx_analytics_events_job_id
  ON analytics_events (job_id);

-- =====================
-- FUNCTIONS
-- =====================

-- Copies the job's category and tags onto the event row at insert time.
--
-- This is a trigger rather than something the caller supplies so the values
-- cannot be spoofed by whoever is hitting the tracking endpoint, and so they
-- cannot silently drift from `jobs` between insert paths.
--
-- Note it deliberately does NOT overwrite `occurred_at`: the only writer is the
-- server-side /api/track route, which never sends one, so the column DEFAULT is
-- already authoritative. Leaving it settable keeps seeding and backfill possible.
CREATE OR REPLACE FUNCTION analytics_events_denormalize()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_id IS NOT NULL THEN
    SELECT j.job_type, j.tags
      INTO NEW.job_type, NEW.tags
      FROM jobs j
     WHERE j.id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS analytics_events_denormalize_trigger ON analytics_events;
CREATE TRIGGER analytics_events_denormalize_trigger
  BEFORE INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION analytics_events_denormalize();

-- The calendar step for one bucket of the given granularity.
--
-- `date_trunc` accepts 'quarter' but the interval type does not, so quarters
-- have to be expressed as 3 months. This is also the single place bad
-- granularity input is rejected.
CREATE OR REPLACE FUNCTION analytics_bucket_step(p_granularity TEXT)
RETURNS INTERVAL AS $$
BEGIN
  IF p_granularity NOT IN ('week', 'month', 'quarter', 'year') THEN
    RAISE EXCEPTION 'analytics: unsupported granularity %', p_granularity
      USING HINT = 'Expected one of week, month, quarter, year';
  END IF;

  RETURN CASE p_granularity
    WHEN 'week'    THEN INTERVAL '1 week'
    WHEN 'month'   THEN INTERVAL '1 month'
    WHEN 'quarter' THEN INTERVAL '3 months'
    WHEN 'year'    THEN INTERVAL '1 year'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Start of the reporting window, as an absolute timestamptz.
--
-- This is the value every aggregation compares `occurred_at` against. Keeping
-- it as a bare `occurred_at >= <constant>` comparison is what makes the queries
-- index-sargable. The tempting alternative --
--   WHERE date_trunc('week', occurred_at) >= ...
-- -- wraps the indexed column in a function call and forces a sequential scan,
-- so do not write it that way.
CREATE OR REPLACE FUNCTION analytics_window_start(
  p_granularity TEXT,
  p_buckets INT,
  p_tz TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (
    date_trunc(p_granularity, (now() AT TIME ZONE p_tz))
      - (GREATEST(p_buckets, 1) - 1) * analytics_bucket_step(p_granularity)
  ) AT TIME ZONE p_tz;
$$;

-- The dense list of bucket boundaries, as local wall-clock timestamps.
--
-- Buckets are cut in local time (Australia/Melbourne by default), not UTC --
-- "this week" for a Monash society means Melbourne's week. Converting back to
-- timestamptz at the end is what keeps boundaries pinned to local midnight
-- across daylight saving transitions.
CREATE OR REPLACE FUNCTION analytics_bucket_series(
  p_granularity TEXT,
  p_buckets INT,
  p_tz TEXT
)
RETURNS SETOF TIMESTAMP
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT generate_series(
    date_trunc(p_granularity, (now() AT TIME ZONE p_tz))
      - (GREATEST(p_buckets, 1) - 1) * analytics_bucket_step(p_granularity),
    date_trunc(p_granularity, (now() AT TIME ZONE p_tz)),
    analytics_bucket_step(p_granularity)
  );
$$;

-- Distinct viewers and total views per time bucket.
--
-- Distinct viewers are counted per bucket directly. They are deliberately not
-- summed from smaller buckets, because unique counts are not additive -- a
-- visitor active in four weeks of a month is four weekly viewers but one
-- monthly viewer. That non-additivity is the reason this reads raw events
-- rather than a pre-aggregated rollup table.
--
-- Empty periods come back as explicit zero rows via the generate_series join,
-- so a quiet week renders as a zero bar instead of vanishing from the chart.
CREATE OR REPLACE FUNCTION analytics_viewers_by_bucket(
  p_granularity TEXT DEFAULT 'month',
  p_buckets INT DEFAULT 12,
  p_tz TEXT DEFAULT 'Australia/Melbourne'
)
RETURNS TABLE (bucket_start TIMESTAMPTZ, viewers BIGINT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      date_trunc(p_granularity, (e.occurred_at AT TIME ZONE p_tz)) AS bucket_local,
      COUNT(DISTINCT e.visitor_id) AS viewers,
      COUNT(*) AS views
    FROM analytics_events e
    WHERE e.event_type = 'view'
      AND e.occurred_at >= analytics_window_start(p_granularity, p_buckets, p_tz)
    GROUP BY 1
  )
  SELECT
    (s.bucket_local AT TIME ZONE p_tz)::TIMESTAMPTZ,
    COALESCE(a.viewers, 0)::BIGINT,
    COALESCE(a.views, 0)::BIGINT
  FROM analytics_bucket_series(p_granularity, p_buckets, p_tz) AS s(bucket_local)
  LEFT JOIN agg a ON a.bucket_local = s.bucket_local
  ORDER BY 1;
$$;

-- What kinds of jobs users engage with, over the same window.
--
-- Returns job categories and tags in one result set, discriminated by
-- `dimension`, so the dashboard can render both without a second round trip.
-- Every event type counts as interest, not just views -- an apply click is a
-- stronger interest signal than a view, and excluding it would understate.
CREATE OR REPLACE FUNCTION analytics_interest_breakdown(
  p_granularity TEXT DEFAULT 'month',
  p_buckets INT DEFAULT 12,
  p_tz TEXT DEFAULT 'Australia/Melbourne',
  p_limit INT DEFAULT 12
)
RETURNS TABLE (dimension TEXT, label TEXT, events BIGINT, visitors BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT e.visitor_id, e.job_type, e.tags
    FROM analytics_events e
    WHERE e.occurred_at >= analytics_window_start(p_granularity, p_buckets, p_tz)
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

-- Clicked / applied / shared counters over the window.
--
-- Returns both the raw event count and the number of distinct jobs involved,
-- because "number of jobs clicked" is genuinely ambiguous between the two and
-- the dashboard should show the honest pair rather than pick one silently.
CREATE OR REPLACE FUNCTION analytics_action_counts(
  p_granularity TEXT DEFAULT 'month',
  p_buckets INT DEFAULT 12,
  p_tz TEXT DEFAULT 'Australia/Melbourne'
)
RETURNS TABLE (action TEXT, events BIGINT, distinct_jobs BIGINT, visitors BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    e.event_type,
    COUNT(*)::BIGINT,
    COUNT(DISTINCT e.job_id)::BIGINT,
    COUNT(DISTINCT e.visitor_id)::BIGINT
  FROM analytics_events e
  WHERE e.occurred_at >= analytics_window_start(p_granularity, p_buckets, p_tz)
  GROUP BY e.event_type
  ORDER BY 1;
$$;

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Read is admin-only, matching the job_feedback pattern.
DROP POLICY IF EXISTS "Admins can read analytics events" ON analytics_events;
CREATE POLICY "Admins can read analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete analytics events" ON analytics_events;
CREATE POLICY "Admins can delete analytics events"
  ON analytics_events
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Deliberately NO public INSERT policy, unlike job_feedback.
--
-- All writes go through /api/track using the service-role client, which
-- bypasses RLS. Granting anon INSERT here would be an unauthenticated, unrated
-- write endpoint straight into the events table; routing through the API route
-- instead means the visitor id comes from a server-read cookie and the
-- denormalized columns come from the trigger.

-- =====================
-- GRANTS
-- =====================
-- The aggregation functions are SECURITY INVOKER, so RLS still applies and a
-- non-admin caller gets zero rows. Revoking from PUBLIC on top of that keeps
-- the anon key from calling them at all.

-- Table privileges. RLS is what actually decides access; these just make the
-- migration self-contained rather than relying on Supabase's default grants.
-- Note `anon` gets nothing: it has no policy either, so tracking has to go
-- through the service-role route.
GRANT SELECT, DELETE ON analytics_events TO authenticated;
GRANT ALL ON analytics_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE analytics_events_id_seq TO service_role;

REVOKE EXECUTE ON FUNCTION analytics_viewers_by_bucket(TEXT, INT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION analytics_interest_breakdown(TEXT, INT, TEXT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION analytics_action_counts(TEXT, INT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION analytics_viewers_by_bucket(TEXT, INT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION analytics_interest_breakdown(TEXT, INT, TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION analytics_action_counts(TEXT, INT, TEXT) TO authenticated, service_role;
