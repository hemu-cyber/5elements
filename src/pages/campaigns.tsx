import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Link2, MousePointerClick, Calendar } from 'lucide-react';
import { getCampaigns, getLinks } from '@/lib/store';
import { Campaign } from '@/types/database';
import { CreateCampaignModal } from '@/components/campaigns/create-campaign-modal';
import { useAuth } from '@/lib/auth-context';

export function CampaignsPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const refreshCampaigns = () => {
    setCampaigns(getCampaigns().filter((campaign) => isAdmin || campaign.user_id === user?.id));
  };

  useEffect(() => {
    refreshCampaigns();
  }, [user?.id, isAdmin]);

  const links = getLinks().filter((link) => isAdmin || link.user_id === user?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Group links into structured initiatives and measure aggregate traffic."
        action={
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </Button>
        }
      />

      {campaigns.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="font-semibold">No campaigns yet</h2>
          <p className="mt-1 text-sm text-muted">Create a campaign to organize your short links.</p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const campaignLinks = links.filter((link) => link.campaign_id === campaign.id);
            const totalClicks = campaignLinks.reduce((total, link) => total + link.click_count, 0);
            const active = !campaign.ends_at || new Date(campaign.ends_at).getTime() >= Date.now();
            return (
              <Card key={campaign.id} className="flex flex-col justify-between transition-colors hover:border-brand/40">
                <div>
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: campaign.color }} />
                      <CardTitle className="text-base font-semibold">{campaign.name}</CardTitle>
                    </div>
                    <Badge variant={active ? 'active' : 'expired'}>{active ? 'Active' : 'Closed'}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="min-h-[36px] text-xs text-muted dark:text-muted-dark">
                      {campaign.description || 'No campaign description provided.'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted dark:text-muted-dark">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString() : 'No start date'}
                        {' – '}
                        {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString() : 'Ongoing'}
                      </span>
                    </div>
                  </CardContent>
                </div>
                <div className="flex items-center justify-between rounded-b-xl border-t border-border bg-canvas/40 p-4 text-xs dark:border-border-dark dark:bg-canvas-dark/40">
                  <div className="flex items-center gap-1.5 font-medium text-ink-soft dark:text-slate-300">
                    <Link2 className="h-3.5 w-3.5 text-muted" />
                    <span>{campaignLinks.length} links</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono font-semibold tabular-nums text-ink dark:text-white">
                    <MousePointerClick className="h-3.5 w-3.5 text-brand" />
                    <span>{totalClicks.toLocaleString()} clicks</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/links?campaign=${encodeURIComponent(campaign.id)}`)}>
                    View links
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCampaignCreated={refreshCampaigns}
      />
    </div>
  );
}
