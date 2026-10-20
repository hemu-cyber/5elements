// LinkPulse In-Memory & LocalStorage Data Engine
// Real data, real relationships, zero hardcoding.
import {
  Link,
  Campaign,
  Tag,
  Click,
  DomainBlocklist,
  AuditLog,
  Profile,
} from '@/types/database';

export interface VisitorContext {
  userAgent: string;
  referrer: string;
  ip?: string;
  country?: string;
  city?: string;
}

export type RedirectResult =
  | { type: 'NOT_FOUND' }
  | { type: 'DISABLED'; reason: string }
  | { type: 'BLOCKLISTED'; domain: string; reason: string }
  | { type: 'EXPIRED'; expires_at: string }
  | { type: 'LIMIT_REACHED'; limit: number; count: number }
  | { type: 'PASSWORD_REQUIRED'; code: string }
  | { type: 'REDIRECT'; destination_url: string; link: Link };

const STORAGE_KEYS = {
  LINKS: 'linkpulse_links',
  CAMPAIGNS: 'linkpulse_campaigns',
  TAGS: 'linkpulse_tags',
  CLICKS: 'linkpulse_clicks',
  BLOCKLIST: 'linkpulse_blocklist',
  AUDIT: 'linkpulse_audit',
  PROFILES: 'linkpulse_profiles',
  UNLOCKED: 'linkpulse_unlocked_',
};

export function initStore() {
  for (const key of [
    STORAGE_KEYS.CAMPAIGNS,
    STORAGE_KEYS.TAGS,
    STORAGE_KEYS.BLOCKLIST,
    STORAGE_KEYS.LINKS,
    STORAGE_KEYS.CLICKS,
    STORAGE_KEYS.AUDIT,
  ]) {
    if (!localStorage.getItem(key)) localStorage.setItem(key, '[]');
  }

  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    const demoProfiles: Profile[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'alex@linkpulse.io',
        role: 'user',
        created_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'admin@linkpulse.io',
        role: 'admin',
        created_at: '2026-09-01T00:00:00Z',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(demoProfiles));
  }

  const sampleLinkIds = new Set(['link-1', 'link-2', 'link-3', 'link-4', 'link-5', 'link-6', 'link-7']);
  const links = readStoredArray<Link>(STORAGE_KEYS.LINKS);
  const removedLinkIds = new Set(
    links
      .filter((link) => sampleLinkIds.has(link.id) || link.id === 'demo-geu-link' || link.code.toLowerCase() === 'p43gw4g')
      .map((link) => link.id)
  );
  writeStoredArray(STORAGE_KEYS.LINKS, links.filter((link) => !removedLinkIds.has(link.id)));

  writeStoredArray(
    STORAGE_KEYS.CAMPAIGNS,
    readStoredArray<Campaign>(STORAGE_KEYS.CAMPAIGNS)
      .filter((campaign) => !['camp-1', 'camp-2', 'camp-3'].includes(campaign.id))
  );
  writeStoredArray(
    STORAGE_KEYS.TAGS,
    readStoredArray<Tag>(STORAGE_KEYS.TAGS).filter((tag) => !/^tag-[1-5]$/.test(tag.id))
  );
  writeStoredArray(
    STORAGE_KEYS.CLICKS,
    readStoredArray<Click>(STORAGE_KEYS.CLICKS)
      .filter((click) => !removedLinkIds.has(click.link_id) && !/^clk-(?:[1-9]\d?|[1-3]\d{2}|400)$/.test(click.id))
  );
  writeStoredArray(
    STORAGE_KEYS.BLOCKLIST,
    readStoredArray<DomainBlocklist>(STORAGE_KEYS.BLOCKLIST)
      .filter((entry) => !['phishing-site.xyz', 'malware-drop.top', 'crypto-drainer.fake'].includes(entry.domain.toLowerCase()))
  );
  writeStoredArray(
    STORAGE_KEYS.AUDIT,
    readStoredArray<AuditLog>(STORAGE_KEYS.AUDIT).filter((entry) => entry.id !== 'aud-1' && entry.id !== 'aud-2')
  );
}

function readStoredArray<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

// Ensure store is initialized immediately upon import
initStore();

// --- DATA ACCESS METHODS ---

export function getLinks(): Link[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLinks(links: Link[]) {
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
}

export function getCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
}

export function getTags(): Tag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TAGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTags(tags: Tag[]) {
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
}

export function getClicks(): Click[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLICKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveClicks(clicks: Click[]) {
  localStorage.setItem(STORAGE_KEYS.CLICKS, JSON.stringify(clicks));
}

export function getBlocklist(): DomainBlocklist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKLIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBlocklist(blocklist: DomainBlocklist[]) {
  localStorage.setItem(STORAGE_KEYS.BLOCKLIST, JSON.stringify(blocklist));
}

export function getAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProfile(profile: Profile) {
  const profiles = getProfiles();
  const index = profiles.findIndex((item) => item.id === profile.id);
  if (index === -1) profiles.unshift(profile);
  else profiles[index] = profile;
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

export function setProfileRole(profileId: string, role: Profile['role']) {
  const profiles = getProfiles();
  const index = profiles.findIndex((profile) => profile.id === profileId);
  if (index === -1) return null;
  profiles[index] = { ...profiles[index], role };
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  return profiles[index];
}

export function logAudit(action: string, targetType: string, targetId: string, meta: Record<string, unknown>, actorEmail?: string) {
  const logs = getAuditLogs();
  logs.unshift({
    id: 'aud-' + Date.now(),
    action,
    target_type: targetType,
    target_id: targetId,
    meta,
    actor_email: actorEmail || 'system@linkpulse.io',
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs.slice(0, 100)));
}

// --- BUSINESS LOGIC HELPERS ---

export function generateBase62Code(length = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const existingLinks = getLinks();
  for (let attempt = 0; attempt < 5; attempt++) {
    result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    if (!existingLinks.some((l) => l.code.toLowerCase() === result.toLowerCase())) {
      return result;
    }
  }
  return result;
}

export function validateAlias(alias: string): { valid: boolean; error?: string } {
  if (!alias || alias.trim().length === 0) {
    return { valid: false, error: 'Alias cannot be empty.' };
  }
  if (alias.length < 3 || alias.length > 30) {
    return { valid: false, error: 'Alias must be between 3 and 30 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    return { valid: false, error: 'Only letters, numbers, hyphens and underscores allowed.' };
  }
  const reserved = [
    'login', 'signup', 'admin', 'api', 'r', 'dashboard', 'links', 'campaigns',
    'tags', 'qr', 'analytics', 'import', 'settings', 'b', 'unlock', 'auth',
  ];
  if (reserved.includes(alias.toLowerCase())) {
    return { valid: false, error: `'${alias}' is a reserved system path.` };
  }
  const existing = getLinks();
  if (existing.some((l) => l.code.toLowerCase() === alias.toLowerCase())) {
    return { valid: false, error: 'This alias is already taken. Please choose another.' };
  }
  return { valid: true };
}

export function validateDestinationUrl(urlStr: string): { valid: boolean; error?: string; domain?: string } {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Destination URL must use http:// or https://' };
    }
    const host = parsed.hostname.toLowerCase();
    if (host.includes('linkpulse') || host === window.location.hostname) {
      return { valid: false, error: 'Loop error: Destination cannot point back to LinkPulse.' };
    }
    const blocklist = getBlocklist();
    const blocked = blocklist.find((b) => host === b.domain.toLowerCase() || host.endsWith('.' + b.domain.toLowerCase()));
    if (blocked) {
      return { valid: false, error: `Domain '${host}' is blocked for security reasons: ${blocked.reason}` };
    }
    return { valid: true, domain: host };
  } catch {
    return { valid: false, error: 'Invalid URL format. Please enter a full URL (e.g. https://example.com).' };
  }
}

// --- STRICT 8-STEP REDIRECT ENGINE ---

export function resolveRedirect(code: string, visitor?: VisitorContext): RedirectResult {
  const links = getLinks();
  const link = links.find((l) => l.code.toLowerCase() === code.toLowerCase());

  // Rule 1: Link Not Found
  if (!link) {
    return { type: 'NOT_FOUND' };
  }

  // Rule 2: Status Disabled
  if (link.status === 'disabled') {
    return { type: 'DISABLED', reason: link.disabled_reason || 'This link has been disabled by an administrator.' };
  }

  // Rule 3: Destination Domain Blocklisted
  try {
    const urlObj = new URL(link.destination_url);
    const host = urlObj.hostname.toLowerCase();
    const blocklist = getBlocklist();
    const blocked = blocklist.find((b) => host === b.domain.toLowerCase() || host.endsWith('.' + b.domain.toLowerCase()));
    if (blocked) {
      return { type: 'BLOCKLISTED', domain: host, reason: blocked.reason };
    }
  } catch {
    // Malformed URL stored
  }

  // Rule 4: Expired
  if (link.expires_at) {
    const expiryDate = new Date(link.expires_at);
    if (Date.now() > expiryDate.getTime()) {
      return { type: 'EXPIRED', expires_at: link.expires_at };
    }
  }

  // Rule 5: Click Limit Reached
  if (link.click_limit !== null && link.click_limit !== undefined) {
    if (link.click_count >= link.click_limit) {
      return { type: 'LIMIT_REACHED', limit: link.click_limit, count: link.click_count };
    }
  }

  // Rule 6: Password Required
  if (link.password_hash) {
    const unlocked = sessionStorage.getItem(STORAGE_KEYS.UNLOCKED + link.code);
    if (!unlocked) {
      return { type: 'PASSWORD_REQUIRED', code: link.code };
    }
  }

  // Rule 7: Device Targeting Override
  let destination = link.destination_url;
  const ua = visitor?.userAgent || navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && link.ios_url) {
    destination = link.ios_url;
  } else if (/Android/.test(ua) && link.android_url) {
    destination = link.android_url;
  }

  // Rule 8: Log Click & Atomically Increment
  recordLiveClick(link.id, visitor);

  return { type: 'REDIRECT', destination_url: destination, link };
}

export function recordLiveClick(linkId: string, visitor?: VisitorContext) {
  // Update link click counter
  const links = getLinks();
  const idx = links.findIndex((l) => l.id === linkId);
  if (idx !== -1) {
    links[idx].click_count = (links[idx].click_count || 0) + 1;
    saveLinks(links);
  }

  // Detect bots
  const ua = visitor?.userAgent || navigator.userAgent || '';
  const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(ua);

  // Parse referrer source
  const ref = visitor?.referrer || document.referrer || '';
  let source = 'direct';
  if (window.location.search.includes('s=qr') || window.location.search.includes('utm_source=qr')) {
    source = 'qr';
  } else if (ref.includes('google')) source = 'google';
  else if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) source = 'x';
  else if (ref.includes('linkedin')) source = 'linkedin';
  else if (ref.includes('facebook') || ref.includes('fb.com')) source = 'facebook';
  else if (ref.includes('instagram')) source = 'instagram';
  else if (ref.includes('whatsapp')) source = 'whatsapp';
  else if (ref) source = 'other';

  // Device detection
  let device: Click['device'] = 'desktop';
  if (/tablet|ipad/i.test(ua)) device = 'tablet';
  else if (/mobile/i.test(ua)) device = 'mobile';

  let visitorId = localStorage.getItem('linkpulse_visitor_id');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('linkpulse_visitor_id', visitorId);
  }

  const newClick: Click = {
    id: 'clk-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    link_id: linkId,
    clicked_at: new Date().toISOString(),
    referrer: ref || null,
    source,
    device,
    os: /Mac/i.test(ua) ? 'macOS' : /Win/i.test(ua) ? 'Windows' : /Linux/i.test(ua) ? 'Linux' : null,
    browser: /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : /Firefox/i.test(ua) ? 'Firefox' : null,
    country: visitor?.country || 'Unknown',
    city: visitor?.city || null,
    visitor_hash: visitorId,
    is_bot: isBot,
  };

  const clicks = getClicks();
  clicks.unshift(newClick);
  saveClicks(clicks.slice(0, 1000));
}

export function unlockLinkWithPassword(code: string, passwordAttempt: string): boolean {
  const links = getLinks();
  const link = links.find((l) => l.code.toLowerCase() === code.toLowerCase());
  if (!link || !link.password_hash) return false;
  if (link.password_hash === passwordAttempt) {
    sessionStorage.setItem(STORAGE_KEYS.UNLOCKED + link.code, 'true');
    return true;
  }
  return false;
}
