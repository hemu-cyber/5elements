-- LinkPulse Schema Initialization Migration
-- Complete Schema, Indexes, Triggers, RLS Policies, and Atomic RPC Functions

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLES
-- ==============================================================================

-- 1.1 Profiles Table (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#0AA5E8',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tags_user_name UNIQUE (user_id, name)
);

-- 1.4 Links Table
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  disabled_reason TEXT,
  disabled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  click_limit INTEGER,
  click_count INTEGER NOT NULL DEFAULT 0,
  ios_url TEXT,
  android_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 Link Tags Pivot Table
CREATE TABLE IF NOT EXISTS public.link_tags (
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- 1.6 Clicks Table
CREATE TABLE IF NOT EXISTS public.clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referrer TEXT,
  source TEXT NOT NULL DEFAULT 'direct',
  device TEXT NOT NULL DEFAULT 'desktop',
  os TEXT,
  browser TEXT,
  country TEXT DEFAULT 'Unknown',
  city TEXT,
  visitor_hash TEXT NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE
);

-- 1.7 Domain Blocklist
CREATE TABLE IF NOT EXISTS public.domain_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.8 Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. INDEXES
-- ==============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_links_code_lower ON public.links (LOWER(code));
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links (user_id);
CREATE INDEX IF NOT EXISTS idx_links_campaign_id ON public.links (campaign_id);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id_clicked_at ON public.clicks (link_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON public.clicks (clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_visitor_hash ON public.clicks (visitor_hash);
CREATE INDEX IF NOT EXISTS idx_domain_blocklist_domain ON public.domain_blocklist (LOWER(domain));
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);

-- ==============================================================================
-- 3. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 3.1 Auth user creation trigger -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.2 Atomic Race-Safe Click Counter Increment
CREATE OR REPLACE FUNCTION public.increment_click_atomic(p_link_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.links
  SET click_count = click_count + 1
  WHERE id = p_link_id
    AND status = 'active'
    AND (click_limit IS NULL OR click_count < click_limit)
    AND (expires_at IS NULL OR expires_at > NOW());

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN (v_updated > 0);
END;
$$;

-- 3.3 Helper Function: Check Admin Status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Prevent users from promoting themselves by updating their own profile row.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an administrator can change account roles.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policies
CREATE POLICY "Users view own profile or admin views all"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users update own profile or admin updates all"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

-- 4.2 Campaigns Policies
CREATE POLICY "Users select own campaigns or admin selects all"
  ON public.campaigns FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users insert own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own campaigns or admin updates all"
  ON public.campaigns FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users delete own campaigns or admin deletes all"
  ON public.campaigns FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- 4.3 Tags Policies
CREATE POLICY "Users select own tags or admin selects all"
  ON public.tags FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users insert own tags"
  ON public.tags FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own tags or admin deletes all"
  ON public.tags FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- 4.4 Links Policies
CREATE POLICY "Users select own links or admin selects all"
  ON public.links FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users insert own links"
  ON public.links FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own links or admin updates all"
  ON public.links FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users delete own links or admin deletes all"
  ON public.links FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- 4.5 Link Tags Policies
CREATE POLICY "Users manage own link tags"
  ON public.link_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.links
      WHERE links.id = link_tags.link_id
        AND (links.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 4.6 Clicks Policies
CREATE POLICY "Users view clicks for owned links or admin views all"
  ON public.clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.links
      WHERE links.id = clicks.link_id
        AND links.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- 4.7 Domain Blocklist Policies
CREATE POLICY "All authenticated users view blocklist"
  ON public.domain_blocklist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage blocklist"
  ON public.domain_blocklist FOR ALL
  USING (public.is_admin());

-- 4.8 Audit Log Policies
CREATE POLICY "Admins view audit logs"
  ON public.audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System logs audit records"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- 5. ANALYTICS VIEWS & RPC AGGREGATIONS
-- ==============================================================================

-- 5.1 Real-time Link Aggregation View
CREATE OR REPLACE VIEW public.v_link_metrics AS
SELECT
  l.id AS link_id,
  l.user_id,
  l.code,
  l.title,
  l.destination_url,
  l.status,
  l.created_at,
  l.expires_at,
  l.click_limit,
  l.click_count,
  COUNT(c.id) FILTER (WHERE c.is_bot = FALSE) AS real_clicks_count,
  COUNT(c.id) FILTER (WHERE c.is_bot = TRUE) AS bot_clicks_count,
  COUNT(DISTINCT c.visitor_hash) FILTER (WHERE c.is_bot = FALSE) AS unique_visitors_count
FROM public.links l
LEFT JOIN public.clicks c ON c.link_id = l.id
GROUP BY l.id;

-- 5.2 User Dashboard Aggregation RPC
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_links INTEGER;
  v_total_clicks BIGINT;
  v_total_uniques BIGINT;
  v_active_links INTEGER;
  v_expiring_soon INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())),
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days')
  INTO v_total_links, v_active_links, v_expiring_soon
  FROM public.links
  WHERE user_id = p_user_id;

  SELECT
    COALESCE(COUNT(c.id) FILTER (WHERE c.is_bot = FALSE), 0),
    COALESCE(COUNT(DISTINCT c.visitor_hash) FILTER (WHERE c.is_bot = FALSE), 0)
  INTO v_total_clicks, v_total_uniques
  FROM public.clicks c
  JOIN public.links l ON l.id = c.link_id
  WHERE l.user_id = p_user_id;

  RETURN jsonb_build_object(
    'total_links', v_total_links,
    'active_links', v_active_links,
    'total_clicks', v_total_clicks,
    'unique_visitors', v_total_uniques,
    'expiring_soon', v_expiring_soon
  );
END;
$$;
