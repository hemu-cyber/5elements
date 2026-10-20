import { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link as LinkType } from '@/types/database';
import { getLinks, saveLinks, logAudit, validateDestinationUrl } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkType | null;
  onLinkUpdated: (updated: LinkType) => void;
  onLinkDeleted: (id: string) => void;
}

export function EditLinkModal({
  isOpen,
  onClose,
  link,
  onLinkUpdated,
  onLinkDeleted,
}: EditLinkModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');
  const [clickLimit, setClickLimit] = useState<string>('');
  const [password, setPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (link && isOpen) {
      setTitle(link.title);
      setDestinationUrl(link.destination_url);
      setStatus(link.status);
      setClickLimit(link.click_limit ? String(link.click_limit) : '');
      setPassword(link.password_hash || '');
      setExpiryDate(link.expires_at ? link.expires_at.slice(0, 16) : '');
      setError(null);
    }
  }, [link, isOpen]);

  if (!isOpen || !link) return null;

  const handleSave = () => {
    const check = validateDestinationUrl(destinationUrl);
    if (!check.valid) {
      setError(check.error || 'Invalid destination URL.');
      return;
    }

    const updated: LinkType = {
      ...link,
      title: title.trim() || link.title,
      destination_url: destinationUrl.trim(),
      status,
      click_limit: clickLimit ? parseInt(clickLimit, 10) : null,
      password_hash: password ? password.trim() : null,
      expires_at: expiryDate ? new Date(expiryDate).toISOString() : null,
    };

    const links = getLinks();
    const idx = links.findIndex((l) => l.id === link.id);
    if (idx !== -1) {
      links[idx] = updated;
      saveLinks(links);
      logAudit('link.update', 'link', link.id, { title: updated.title }, user?.email);
      onLinkUpdated(updated);
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete /r/${link.code}?`)) {
      const links = getLinks().filter((l) => l.id !== link.id);
      saveLinks(links);
      logAudit('link.delete', 'link', link.id, { code: link.code }, user?.email);
      onLinkDeleted(link.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-modal dark:border-border-dark dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between border-b border-border dark:border-border-dark pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-ink dark:text-white">
              Edit Short Link
            </h3>
            <p className="text-xs font-mono text-brand">/r/{link.code}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-tint p-3 text-xs text-danger flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-ink dark:text-white">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-ink dark:text-white">Destination URL</label>
            <input
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink dark:text-white">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
              >
                <option value="active">Active (Redirects live)</option>
                <option value="disabled">Disabled (Redirect halted)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink dark:text-white">Click Cap</label>
              <input
                type="number"
                placeholder="No limit"
                value={clickLimit}
                onChange={(e) => setClickLimit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink dark:text-white">Password</label>
              <input
                type="text"
                placeholder="None"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-ink dark:text-white">Expires At</label>
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border dark:border-border-dark pt-4">
          <Button
            variant="destructiveOutline"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Link</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
