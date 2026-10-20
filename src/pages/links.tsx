import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Copy,
  Check,
  QrCode,
  Edit,
  Lock,
  Clock,
  Smartphone,
  ExternalLink,
  PowerOff,
  Power,
} from 'lucide-react';
import { getLinks, saveLinks, getCampaigns, logAudit } from '@/lib/store';
import { Link as LinkType } from '@/types/database';
import { CreateLinkModal } from '@/components/links/create-link-modal';
import { QrCodeModal } from '@/components/links/qr-code-modal';
import { EditLinkModal } from '@/components/links/edit-link-modal';
import { useAuth } from '@/lib/auth-context';

export function LinksPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [links, setLinks] = useState<LinkType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'expired' | 'limited'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQrLink, setSelectedQrLink] = useState<LinkType | null>(null);
  const [selectedEditLink, setSelectedEditLink] = useState<LinkType | null>(null);

  const campaigns = getCampaigns();

  const refreshLinks = () => {
    setLinks(getLinks().filter((link) => isAdmin || link.user_id === user?.id));
  };

  useEffect(() => {
    refreshLinks();
  }, [user?.id, isAdmin]);

  // Listen for ?create=true in URL
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCopy = (id: string, code: string) => {
    const fullUrl = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = (link: LinkType) => {
    const newStatus: LinkType['status'] = link.status === 'active' ? 'disabled' : 'active';
    const updated = {
      ...link,
      status: newStatus,
      disabled_reason: newStatus === 'disabled' ? 'Quick killswitch executed from links panel.' : null,
      disabled_by: newStatus === 'disabled' ? user?.id : null,
    };
    const all = getLinks();
    const idx = all.findIndex((l) => l.id === link.id);
    if (idx !== -1) {
      all[idx] = updated;
      saveLinks(all);
      logAudit(
        newStatus === 'disabled' ? 'link.disable' : 'link.enable',
        'link',
        link.id,
        { code: link.code },
        user?.email
      );
      refreshLinks();
    }
  };

  // Helper to compute link status dynamically
  const getComputedStatus = (l: LinkType): 'active' | 'disabled' | 'expired' | 'limited' => {
    if (l.status === 'disabled') return 'disabled';
    if (l.expires_at && Date.now() > new Date(l.expires_at).getTime()) return 'expired';
    if (l.click_limit && l.click_count >= l.click_limit) return 'limited';
    return 'active';
  };

  const filteredLinks = links.filter((l) => {
    const campaignId = searchParams.get('campaign');
    if (campaignId && l.campaign_id !== campaignId) return false;
    const computed = getComputedStatus(l);
    if (statusFilter !== 'all' && computed !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchCode = l.code.toLowerCase().includes(q);
      const matchDest = l.destination_url.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchDest) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Links"
        description="Create, monitor, and enforce redirection policies across all active links."
        action={
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Link</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted dark:text-muted-dark" />
            <input
              type="text"
              placeholder="Search by title, destination, or /r/code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas pl-9 pr-4 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-border-dark dark:bg-canvas-dark dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-xs font-medium text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
              <option value="limited">Click Limited</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Links List Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-[11px] font-semibold uppercase tracking-wider text-muted dark:bg-canvas-dark dark:text-muted-dark border-b border-border dark:border-border-dark">
              <tr>
                <th className="px-6 py-3">Link Details</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rules</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted">
                    No links found matching your search. Click "Create Link" to create one.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => {
                  const compStatus = getComputedStatus(link);
                  const camp = campaigns.find((c) => c.id === link.campaign_id);

                  return (
                    <tr
                      key={link.id}
                      className="transition-colors hover:bg-canvas/60 dark:hover:bg-canvas-dark/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink dark:text-white">
                            {link.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`/r/${link.code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-xs text-brand font-medium hover:underline inline-flex items-center gap-1"
                              title="Test redirect in new tab"
                            >
                              <span>/r/{link.code}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              onClick={() => handleCopy(link.id, link.code)}
                              className="rounded p-1 text-muted hover:text-ink dark:hover:text-white transition-colors"
                              title="Copy short URL"
                            >
                              {copiedId === link.id ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="truncate max-w-xs text-xs text-muted dark:text-muted-dark mt-0.5">
                            {link.destination_url}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-ink-soft dark:text-slate-300">
                        {camp ? (
                          <Badge variant="neutral" className="text-[11px]">
                            <span
                              className="mr-1.5 h-2 w-2 rounded-full inline-block"
                              style={{ backgroundColor: camp.color }}
                            />
                            {camp.name}
                          </Badge>
                        ) : (
                          <span className="text-muted/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={compStatus} dot={compStatus === 'active'}>
                          {compStatus.charAt(0).toUpperCase() + compStatus.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-muted dark:text-muted-dark">
                          {link.password_hash && (
                            <span title="Password Protected">
                              <Lock className="h-3.5 w-3.5 text-signal" />
                            </span>
                          )}
                          {(link.ios_url || link.android_url) && (
                            <span title="Device Targeting Enabled">
                              <Smartphone className="h-3.5 w-3.5 text-brand" />
                            </span>
                          )}
                          {link.click_limit !== null && (
                            <span title={`Click Limit: ${link.click_limit}`}>
                              <Clock className="h-3.5 w-3.5 text-warning" />
                            </span>
                          )}
                          {!link.password_hash && !link.ios_url && !link.android_url && link.click_limit === null && (
                            <span className="text-xs text-muted/60">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-medium tabular-nums text-ink dark:text-white">
                        {link.click_count.toLocaleString()}
                        {link.click_limit && (
                          <span className="text-xs text-muted font-normal ml-1">
                            / {link.click_limit}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Active / Disabled Killswitch */}
                          <button
                            onClick={() => handleToggleStatus(link)}
                            className={`rounded-lg p-1.5 transition-colors ${
                              link.status === 'active'
                                ? 'text-muted hover:text-danger hover:bg-danger-tint'
                                : 'text-danger hover:text-success hover:bg-success-tint'
                            }`}
                            title={link.status === 'active' ? 'Instant Killswitch: Disable Link' : 'Re-enable Link'}
                          >
                            {link.status === 'active' ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>

                          {/* QR Code Modal Trigger */}
                          <button
                            onClick={() => setSelectedQrLink(link)}
                            className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-canvas dark:hover:text-white"
                            title="Generate & Download QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>

                          {/* Edit Modal Trigger */}
                          <button
                            onClick={() => setSelectedEditLink(link)}
                            className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-canvas dark:hover:text-white"
                            title="Edit Link Configuration"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLinkCreated={() => refreshLinks()}
      />

      <QrCodeModal
        isOpen={!!selectedQrLink}
        onClose={() => setSelectedQrLink(null)}
        link={selectedQrLink}
      />

      <EditLinkModal
        isOpen={!!selectedEditLink}
        onClose={() => setSelectedEditLink(null)}
        link={selectedEditLink}
        onLinkUpdated={() => refreshLinks()}
        onLinkDeleted={() => refreshLinks()}
      />
    </div>
  );
}
