import { useState } from 'react';
import { X, FolderPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Campaign } from '@/types/database';
import { getCampaigns, saveCampaigns, logAudit } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: (campaign: Campaign) => void;
}

export function CreateCampaignModal({ isOpen, onClose, onCampaignCreated }: CreateCampaignModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0AA5E8');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;

    const newCamp: Campaign = {
      id: 'camp-' + Date.now(),
      user_id: user?.id || '00000000-0000-0000-0000-000000000001',
      name: name.trim(),
      description: description.trim() || null,
      color,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      created_at: new Date().toISOString(),
    };

    const camps = getCampaigns();
    camps.unshift(newCamp);
    saveCampaigns(camps);

    logAudit('campaign.create', 'campaign', newCamp.id, { name: newCamp.name }, user?.email);
    onCampaignCreated(newCamp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-modal dark:border-border-dark dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between border-b border-border dark:border-border-dark pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-brand" />
            <h3 className="font-heading text-lg font-bold text-ink dark:text-white">
              New Campaign
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-ink dark:text-white">Campaign Name *</label>
            <input
              type="text"
              placeholder="e.g. Q4 Black Friday Promo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-ink dark:text-white">Description</label>
            <textarea
              rows={2}
              placeholder="Brief campaign objective and attribution tags"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-ink dark:text-white">Accent Color</label>
            <div className="mt-1.5 flex items-center gap-2">
              {['#0AA5E8', '#FF7A1A', '#12A150', '#14181F', '#8ED8F5', '#E5484D'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border border-white shadow-sm transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-brand ring-offset-1' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink dark:text-white">Start Date</label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
              />
            </div>
            <div>
              <label className="font-semibold text-ink dark:text-white">End Date</label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border dark:border-border-dark pt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={!name.trim()}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Create Campaign</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
