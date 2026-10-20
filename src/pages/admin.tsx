import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Ban,
  Users,
  ScrollText,
  Activity,
  Search,
  Power,
  PowerOff,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  getAuditLogs,
  getBlocklist,
  getLinks,
  getProfiles,
  logAudit,
  saveBlocklist,
  saveLinks,
  setProfileRole,
} from '@/lib/store';
import { AuditLog, DomainBlocklist, Link, Profile, UserRole } from '@/types/database';
import { useAuth } from '@/lib/auth-context';

type AdminTab = 'links' | 'blocklist' | 'users' | 'audit';

export function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('links');
  const [links, setLinks] = useState<Link[]>([]);
  const [blocklist, setBlocklist] = useState<DomainBlocklist[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [domain, setDomain] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshData = () => {
    setLinks(getLinks());
    setBlocklist(getBlocklist());
    setProfiles(getProfiles());
    setAuditLogs(getAuditLogs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredLinks = links.filter((link) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || [link.title, link.code, link.destination_url, link.user_id]
      .some((value) => value.toLowerCase().includes(query));
  });
  const filteredProfiles = profiles.filter((profile) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || profile.email.toLowerCase().includes(query) || profile.role.includes(query);
  });

  const toggleLink = (link: Link) => {
    const status: Link['status'] = link.status === 'active' ? 'disabled' : 'active';
    const updated = {
      ...link,
      status,
      disabled_reason: status === 'disabled' ? 'Disabled by an administrator.' : null,
      disabled_by: status === 'disabled' ? user?.id || null : null,
    };
    saveLinks(links.map((item) => item.id === link.id ? updated : item));
    logAudit(status === 'disabled' ? 'link.disable' : 'link.enable', 'link', link.id, { code: link.code }, user?.email);
    refreshData();
  };

  const addDomain = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    let hostname = '';
    try {
      hostname = new URL(domain.includes('://') ? domain : `https://${domain}`).hostname.toLowerCase();
    } catch {
      setError('Enter a valid domain name.');
      return;
    }
    if (!hostname || hostname.includes('..') || hostname === 'localhost') {
      setError('Enter a valid public domain name.');
      return;
    }
    if (blocklist.some((item) => item.domain.toLowerCase() === hostname)) {
      setError('That domain is already blocked.');
      return;
    }
    const entry: DomainBlocklist = {
      id: `blk-${crypto.randomUUID()}`,
      domain: hostname,
      reason: reason.trim(),
      added_by: user?.email || null,
      created_at: new Date().toISOString(),
    };
    saveBlocklist([entry, ...blocklist]);
    logAudit('domain.block', 'domain', hostname, { reason: entry.reason }, user?.email);
    setDomain('');
    setReason('');
    refreshData();
  };

  const removeDomain = (entry: DomainBlocklist) => {
    saveBlocklist(blocklist.filter((item) => item.id !== entry.id));
    logAudit('domain.unblock', 'domain', entry.domain, {}, user?.email);
    refreshData();
  };

  const updateRole = (profile: Profile, role: UserRole) => {
    if (profile.id === user?.id && role !== 'admin') {
      setError('You cannot remove administrator access from your own account.');
      return;
    }
    const updated = setProfileRole(profile.id, role);
    if (!updated) {
      setError('Unable to update this account role.');
      return;
    }
    setError(null);
    logAudit('user.role.update', 'profile', profile.id, { role, email: profile.email }, user?.email);
    refreshData();
  };

  const tabs: { id: AdminTab; label: string; icon: typeof Activity }[] = [
    { id: 'links', label: 'All Platform Links', icon: Activity },
    { id: 'blocklist', label: 'Domain Blocklist', icon: Ban },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'audit', label: 'Audit Trail', icon: ScrollText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Governance"
        description="Manage platform links, account roles, domain safety rules, and audit history."
        action={<Badge variant="brand" className="px-3 py-1 font-mono text-xs">Admin Privileges Active</Badge>}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3 dark:border-border-dark">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); setError(null); }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-ink font-semibold text-white shadow-subtle dark:bg-surface dark:text-ink'
                : 'text-muted hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg bg-danger-tint p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {activeTab === 'blocklist' && (
        <Card>
          <CardHeader className="border-b border-border pb-4 dark:border-border-dark">
            <CardTitle className="text-base font-semibold">Active Domain Blocklist</CardTitle>
            <p className="mt-1 text-xs text-muted dark:text-muted-dark">
              New and existing redirects to blocked domains are prevented.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <form onSubmit={addDomain} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
              <input
                required
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="example.com"
                aria-label="Domain to block"
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm dark:border-border-dark dark:bg-canvas-dark"
              />
              <input
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason for blocking"
                aria-label="Reason for blocking"
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm dark:border-border-dark dark:bg-canvas-dark"
              />
              <Button type="submit" variant="destructive" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Block Domain
              </Button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-[11px] uppercase tracking-wider text-muted dark:bg-canvas-dark dark:text-muted-dark">
                  <tr><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Added By</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border-dark">
                  {blocklist.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-danger">{entry.domain}</td>
                      <td className="px-4 py-3 text-xs">{entry.reason}</td>
                      <td className="px-4 py-3 text-xs">{entry.added_by || 'Unknown'}</td>
                      <td className="px-4 py-3 text-xs">{new Date(entry.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeDomain(entry)} className="text-danger">Unblock</Button>
                      </td>
                    </tr>
                  ))}
                  {blocklist.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">No blocked domains.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'links' && (
        <Card>
          <CardHeader className="border-b border-border pb-4 dark:border-border-dark">
            <CardTitle className="text-base font-semibold">Global Link Directory</CardTitle>
            <p className="mt-1 text-xs text-muted dark:text-muted-dark">Disable or re-enable any link across the platform.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <label className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                type="search"
                placeholder="Filter by owner, title, code, or destination..."
                className="w-full rounded-lg border border-border bg-canvas p-2 text-xs dark:border-border-dark dark:bg-canvas-dark"
              />
            </label>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-[11px] uppercase tracking-wider text-muted dark:bg-canvas-dark dark:text-muted-dark">
                  <tr><th className="px-4 py-3">Link</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Clicks</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border-dark">
                  {filteredLinks.map((link) => (
                    <tr key={link.id}>
                      <td className="max-w-sm px-4 py-3">
                        <div className="font-medium">{link.title}</div>
                        <a className="font-mono text-xs text-brand hover:underline" href={`/r/${link.code}`} target="_blank" rel="noreferrer">/r/{link.code} · {link.destination_url}</a>
                      </td>
                      <td className="px-4 py-3 text-xs">{profiles.find((profile) => profile.id === link.user_id)?.email || link.user_id}</td>
                      <td className="px-4 py-3"><Badge variant={link.status}>{link.status}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono">{link.click_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleLink(link)} aria-label={`${link.status === 'active' ? 'Disable' : 'Enable'} ${link.code}`}>
                          {link.status === 'active' ? <PowerOff className="h-4 w-4 text-danger" /> : <Power className="h-4 w-4 text-success" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredLinks.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">No matching links found.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader className="border-b border-border pb-4 dark:border-border-dark">
            <CardTitle className="text-base font-semibold">Platform Accounts</CardTitle>
            <p className="mt-1 text-xs text-muted dark:text-muted-dark">Manage account roles. New accounts always start as standard users.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <label className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                type="search"
                placeholder="Search by account email or role..."
                className="w-full rounded-lg border border-border bg-canvas p-2 text-xs dark:border-border-dark dark:bg-canvas-dark"
              />
            </label>
            <div className="divide-y divide-border dark:divide-border-dark">
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{profile.email}</p>
                    <p className="text-xs text-muted">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>
                  <select
                    value={profile.role}
                    onChange={(event) => updateRole(profile, event.target.value as UserRole)}
                    aria-label={`Role for ${profile.email}`}
                    className="rounded-lg border border-border bg-canvas px-3 py-2 text-xs dark:border-border-dark dark:bg-canvas-dark"
                  >
                    <option value="user">Standard user</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              ))}
              {filteredProfiles.length === 0 && <p className="py-8 text-center text-xs text-muted">No accounts found.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card>
          <CardHeader className="border-b border-border pb-4 dark:border-border-dark">
            <CardTitle className="text-base font-semibold">Security Audit Log</CardTitle>
            <p className="mt-1 text-xs text-muted dark:text-muted-dark">Recent administrative actions and link changes.</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-border dark:divide-border-dark">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-muted">{entry.target_type}: {entry.target_id} · {entry.actor_email || 'System'}</p>
                  </div>
                  <time className="text-xs text-muted">{new Date(entry.created_at).toLocaleString()}</time>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="py-8 text-center text-xs text-muted">No audit events recorded.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
