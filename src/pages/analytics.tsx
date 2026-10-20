import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getClicks, getLinks } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Click, Link as ShortLink } from '@/types/database';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Download, Bot, Radio } from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d';

interface AnalyticsSnapshot {
  links: ShortLink[];
  clicks: Click[];
}

const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90 };
const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct',
  google: 'Google',
  x: 'X / Twitter',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  qr: 'QR Scan',
  other: 'Other',
  bot: 'Bot',
};
const CHART_PALETTE = ['#0AA5E8', '#14181F', '#FF7A1A', '#8ED8F5', '#A7B1BC', '#12A150'];

function getPeriodStart(days: number, now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return start;
}

function escapeCsv(value: string | number | null | undefined): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AnalyticsPage() {
  const { user, isAdmin } = useAuth();
  const [includeBots, setIncludeBots] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>(() => ({
    links: getLinks(),
    clicks: getClicks(),
  }));
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const refresh = useCallback(() => {
    setSnapshot({ links: getLinks(), clicks: getClicks() });
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const now = new Date();
  const days = RANGE_DAYS[timeRange];
  const periodStart = getPeriodStart(days, now);
  const ownLinks = useMemo(
    () => snapshot.links.filter((link) => isAdmin || link.user_id === user?.id),
    [isAdmin, snapshot.links, user?.id]
  );
  const ownLinkIds = useMemo(() => new Set(ownLinks.map((link) => link.id)), [ownLinks]);
  const allOwnedClicks = useMemo(
    () => snapshot.clicks.filter((click) => ownLinkIds.has(click.link_id)),
    [snapshot.clicks, ownLinkIds]
  );
  const periodClicks = useMemo(
    () => allOwnedClicks.filter((click) => {
      const clickedAt = new Date(click.clicked_at).getTime();
      return clickedAt >= periodStart.getTime() &&
        clickedAt <= now.getTime() &&
        (includeBots || !click.is_bot);
    }),
    [allOwnedClicks, includeBots, periodStart.getTime(), now.getTime()]
  );
  const previousStart = new Date(periodStart);
  previousStart.setDate(previousStart.getDate() - days);
  const previousClicks = useMemo(
    () => allOwnedClicks.filter((click) => {
      const clickedAt = new Date(click.clicked_at).getTime();
      return clickedAt >= previousStart.getTime() &&
        clickedAt < periodStart.getTime() &&
        (includeBots || !click.is_bot);
    }),
    [allOwnedClicks, includeBots, previousStart.getTime(), periodStart.getTime()]
  );
  const uniqueVisitors = new Set(periodClicks.map((click) => click.visitor_hash)).size;
  const previousUniqueVisitors = new Set(previousClicks.map((click) => click.visitor_hash)).size;
  const mobileClicks = periodClicks.filter((click) => click.device === 'mobile').length;
  const mobileShare = periodClicks.length ? (mobileClicks / periodClicks.length) * 100 : 0;

  const timeseriesData = useMemo(() => {
    const daily = new Map<string, { clicks: number; visitors: Set<string> }>();
    for (let day = 0; day < days; day += 1) {
      const date = new Date(periodStart);
      date.setDate(periodStart.getDate() + day);
      daily.set(localDateKey(date), { clicks: 0, visitors: new Set() });
    }
    for (const click of periodClicks) {
      const dateKey = localDateKey(new Date(click.clicked_at));
      const entry = daily.get(dateKey);
      if (entry) {
        entry.clicks += 1;
        entry.visitors.add(click.visitor_hash);
      }
    }
    return Array.from(daily, ([date, values]) => ({
      date: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      clicks: values.clicks,
      uniques: values.visitors.size,
    }));
  }, [days, periodClicks, periodStart.getTime()]);

  const sourceData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const click of periodClicks) {
      const source = click.source || 'other';
      totals.set(source, (totals.get(source) || 0) + 1);
    }
    return Array.from(totals, ([source, value]) => ({
      name: SOURCE_LABELS[source] || source,
      value,
      percent: periodClicks.length ? (value / periodClicks.length) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [periodClicks]);

  const countryData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const click of periodClicks) {
      const country = click.country && click.country !== 'Unknown' ? click.country : 'Unknown';
      totals.set(country, (totals.get(country) || 0) + 1);
    }
    return Array.from(totals, ([country, clicks]) => ({
      country,
      code: /^[A-Z]{2}$/.test(country) ? country : '—',
      clicks,
      percent: periodClicks.length ? Math.round((clicks / periodClicks.length) * 100) : 0,
    })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  }, [periodClicks]);

  const exportCsv = () => {
    const linksById = new Map(snapshot.links.map((link) => [link.id, link]));
    const rows = [
      ['clicked_at', 'link_code', 'source', 'device', 'country', 'is_bot'],
      ...periodClicks.map((click) => [
        click.clicked_at,
        linksById.get(click.link_id)?.code || '',
        click.source,
        click.device,
        click.country || 'Unknown',
        click.is_bot ? 'true' : 'false',
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `linkpulse-analytics-${timeRange}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const percentageChange = (current: number, previous: number) => {
    if (!previous) return current ? 'New activity' : 'No change';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs previous ${timeRange}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Traffic activity recorded for your links. Data refreshes every 5 seconds."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={includeBots ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIncludeBots(!includeBots)}
              className="gap-1.5"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>{includeBots ? 'Bots Included' : 'Exclude Bots'}</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="h-3.5 w-3.5 text-muted" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      <p className="text-xs text-muted dark:text-muted-dark">
        Link and click data is currently stored in this browser. Supabase authentication does not sync analytics across devices.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 dark:border-border-dark">
        <div className="flex items-center rounded-lg border border-border bg-canvas p-0.5 text-xs font-medium dark:border-border-dark dark:bg-canvas-dark">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-md px-3 py-1 transition-all ${
                timeRange === range
                  ? 'bg-surface text-ink font-semibold shadow-subtle dark:bg-surface-dark dark:text-white'
                  : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-white'
              }`}
            >
              Last {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted dark:text-muted-dark">
          <Radio className="h-3.5 w-3.5 text-brand" />
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <span className="text-xs text-muted dark:text-muted-dark">Total Redirections</span>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-ink dark:text-white">
            {periodClicks.length.toLocaleString()}
          </p>
          <span className="mt-1 inline-block text-xs text-muted dark:text-muted-dark">
            {percentageChange(periodClicks.length, previousClicks.length)}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted dark:text-muted-dark">Unique Visitors</span>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-ink dark:text-white">
            {uniqueVisitors.toLocaleString()}
          </p>
          <span className="mt-1 inline-block text-xs text-muted dark:text-muted-dark">
            {percentageChange(uniqueVisitors, previousUniqueVisitors)}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted dark:text-muted-dark">Mobile Share</span>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-ink dark:text-white">
            {mobileShare.toFixed(1)}%
          </p>
          <span className="mt-1 inline-block text-xs text-muted dark:text-muted-dark">
            Based on {periodClicks.length.toLocaleString()} recorded clicks
          </span>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Clicks Over Time</CardTitle>
          <p className="text-xs text-muted dark:text-muted-dark">
            Daily clicks and distinct visitors, calculated from recorded redirect events.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          {periodClicks.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium text-ink dark:text-white">No click data for this period</p>
              <p className="max-w-sm text-xs text-muted dark:text-muted-dark">
                Create or open one of your short links to record a click. Synthetic sample analytics are not shown.
              </p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseriesData}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0AA5E8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0AA5E8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#8B97A4" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8B97A4" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#14181F',
                      border: '1px solid #232B36',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#0AA5E8" strokeWidth={2} fill="url(#colorClicks)" name="Clicks" />
                  <Area type="monotone" dataKey="uniques" stroke="#FF7A1A" strokeWidth={2} fill="transparent" name="Unique visitors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border pb-3 dark:border-border-dark">
            <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {sourceData.length ? sourceData.map((source, index) => (
              <div key={source.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }} />
                  <span className="font-medium text-ink dark:text-white">{source.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted tabular-nums">{source.percent.toFixed(1)}%</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas dark:bg-canvas-dark">
                    <div className="h-full rounded-full" style={{ width: `${source.percent}%`, backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }} />
                  </div>
                </div>
              </div>
            )) : <p className="text-xs text-muted dark:text-muted-dark">No source data for this period.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-3 dark:border-border-dark">
            <CardTitle className="text-base font-semibold">Top Geographies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {countryData.length ? countryData.map((country) => (
              <div key={country.country} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="rounded bg-brand-tint px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand">
                    {country.code}
                  </span>
                  <span className="font-medium text-ink dark:text-white">{country.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-muted">{country.percent}%</span>
                  <span className="font-mono font-semibold tabular-nums text-ink dark:text-white">
                    {country.clicks.toLocaleString()}
                  </span>
                </div>
              </div>
            )) : <p className="text-xs text-muted dark:text-muted-dark">No geography data for this period.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
