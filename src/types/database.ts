export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color: string;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  // Computed / aggregated properties
  total_links?: number;
  total_clicks?: number;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  link_count?: number;
}

export type LinkStatus = 'active' | 'disabled';

export interface Link {
  id: string;
  user_id: string;
  campaign_id?: string | null;
  code: string;
  destination_url: string;
  title: string;
  status: LinkStatus;
  disabled_reason?: string | null;
  disabled_by?: string | null;
  password_hash?: string | null;
  expires_at?: string | null;
  click_limit?: number | null;
  click_count: number;
  ios_url?: string | null;
  android_url?: string | null;
  created_at: string;
  // Associated / joined data
  tags?: Tag[];
  campaign?: Campaign | null;
  // Computed fields
  is_expired?: boolean;
  is_limit_reached?: boolean;
}

export interface LinkTag {
  link_id: string;
  tag_id: string;
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'other';

export interface Click {
  id: string;
  link_id: string;
  clicked_at: string;
  referrer?: string | null;
  source: string;
  device: DeviceType;
  os?: string | null;
  browser?: string | null;
  country: string;
  city?: string | null;
  visitor_hash: string;
  is_bot: boolean;
}

export interface DomainBlocklist {
  id: string;
  domain: string;
  reason: string;
  added_by?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  meta: Record<string, unknown>;
  created_at: string;
  actor_email?: string;
}

export interface DashboardMetrics {
  total_links: number;
  active_links: number;
  total_clicks: number;
  unique_visitors: number;
  expiring_soon: number;
}
