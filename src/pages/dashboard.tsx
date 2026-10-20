import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Link2,
  MousePointerClick,
  Users,
  Clock,
  Plus,
  ArrowUpRight,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLinks, getClicks, getCampaigns } from '@/lib/store';
import { CreateLinkModal } from '@/components/links/create-link-modal';
import { useAuth } from '@/lib/auth-context';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [links, setLinks] = useState(getLinks().filter((link) => isAdmin || link.user_id === user?.id));
  const [clicks, setClicks] = useState(getClicks());
  const [campaigns, setCampaigns] = useState(getCampaigns().filter((campaign) => isAdmin || campaign.user_id === user?.id));
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const refreshData = () => {
    const userLinks = getLinks().filter((link) => isAdmin || link.user_id === user?.id);
    setLinks(userLinks);
    setClicks(getClicks().filter((click) => userLinks.some((link) => link.id === click.link_id)));
    setCampaigns(getCampaigns().filter((campaign) => isAdmin || campaign.user_id === user?.id));
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [user?.id, isAdmin]);

  // Compute live KPIs
  const totalActiveLinks = links.filter(
    (l) => l.status === 'active' && (!l.expires_at || new Date(l.expires_at).getTime() > Date.now())
  ).length;

  const totalClicks = clicks.filter((c) => !c.is_bot).length;

  const uniqueVisitors = new Set(clicks.filter((c) => !c.is_bot).map((c) => c.visitor_hash)).size;

  const expiringSoonCount = links.filter((l) => {
    if (!l.expires_at) return false;
    const diff = new Date(l.expires_at).getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;

  const topLinks = [...links].sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 5);

  const recentClicks = clicks.slice(0, 5);

  const metrics = [
    {
      label: 'Total Active Links',
      value: String(totalActiveLinks),
      icon: Link2,
      subtitle: `across ${campaigns.length} campaigns`,
    },
    {
      label: 'Total Real Clicks',
      value: totalClicks.toLocaleString(),
      icon: MousePointerClick,
      subtitle: 'Recorded clicks, bots filtered out',
    },
    {
      label: 'Unique Visitors',
      value: uniqueVisitors.toLocaleString(),
      icon: Users,
      subtitle: 'Distinct browser visitor IDs',
    },
    {
      label: 'Expiring Soon (<= 7d)',
      value: String(expiringSoonCount),
      icon: Clock,
      subtitle: expiringSoonCount > 0
        ? `${expiringSoonCount} links expire within 7 days`
        : 'No links expiring in the next 7 days',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Current link activity, campaign health, and recently recorded clicks."
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted dark:text-muted-dark">
                {m.label}
              </span>
              <div className="rounded-lg bg-canvas p-1.5 text-muted dark:bg-canvas-dark dark:text-muted-dark">
                <m.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-bold tracking-tight tabular-nums text-ink dark:text-white">
                  {m.value}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted dark:text-muted-dark">{m.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Activity & Top Links Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Links Table (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border dark:border-border-dark">
              <div>
                <CardTitle className="text-base font-semibold">Top Performing Links</CardTitle>
                <p className="text-xs text-muted dark:text-muted-dark mt-0.5">
                  Real traffic recorded in LinkPulse
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/links')}
                className="text-xs gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-[11px] font-semibold uppercase tracking-wider text-muted dark:bg-canvas-dark dark:text-muted-dark">
                  <tr>
                    <th className="px-6 py-3">Link & Code</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Clicks</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border-dark">
                  {topLinks.map((link) => (
                    <tr
                      key={link.id}
                      className="transition-colors hover:bg-canvas/60 dark:hover:bg-canvas-dark/40"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-ink dark:text-white">
                            {link.title}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={`/r/${link.code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-xs text-brand font-medium hover:underline"
                            >
                              /r/{link.code}
                            </a>
                            <span className="text-muted text-xs">•</span>
                            <span className="truncate max-w-[200px] text-xs text-muted dark:text-muted-dark">
                              {link.destination_url}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={link.status === 'active' ? 'active' : 'disabled'} dot={link.status === 'active'}>
                          {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium tabular-nums text-ink dark:text-white">
                        {link.click_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <a
                          href={`/r/${link.code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-ink hover:bg-canvas dark:hover:text-white"
                          title="Open live redirect"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Live Pulse Card (1 col) */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border dark:border-border-dark">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-tint text-brand">
                  <Radio className="h-3.5 w-3.5 animate-pulse-dot" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                  <p className="text-xs text-muted dark:text-muted-dark mt-0.5">
                    Recorded link redirects
                  </p>
                </div>
              </div>
              <Badge variant="brand" className="font-mono text-[10px]">
                Refreshes 3s
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {recentClicks.length === 0 ? (
                <div className="text-center text-xs text-muted py-6">
                  No clicks recorded yet. Click on any short link to test!
                </div>
              ) : (
                recentClicks.map((ev) => {
                  const matchingLink = links.find((l) => l.id === ev.link_id);
                  const timeStr = new Date(ev.clicked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between text-xs border-b border-border/50 pb-3 last:border-none last:pb-0 dark:border-border-dark/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-canvas font-mono text-[10px] font-bold text-ink dark:bg-canvas-dark dark:text-white">
                          {ev.country && ev.country !== 'Unknown' ? ev.country : '—'}
                        </span>
                        <div>
                          <p className="font-medium text-ink dark:text-white">
                            {ev.city || 'Unknown'} <span className="text-muted font-normal">via {ev.browser || 'Browser'}</span>
                          </p>
                          <p className="font-mono text-[11px] text-brand">
                            /r/{matchingLink?.code || 'link'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted dark:text-muted-dark font-mono">
                        {timeStr}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLinkCreated={() => refreshData()}
      />
    </div>
  );
}
