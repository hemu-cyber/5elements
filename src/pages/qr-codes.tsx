import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Plus } from 'lucide-react';
import { getLinks } from '@/lib/store';
import { Link as LinkType } from '@/types/database';
import { QrCodeModal } from '@/components/links/qr-code-modal';
import { useAuth } from '@/lib/auth-context';

export function QrCodesPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [selectedLink, setSelectedLink] = useState<LinkType | null>(null);
  const links = getLinks().filter((link) => isAdmin || link.user_id === user?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Codes"
        description="Generate and download a branded PNG or SVG QR code for any of your short links."
        action={
          <Button variant="primary" onClick={() => navigate('/links?create=true')} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Generate QR</span>
          </Button>
        }
      />

      {links.length === 0 ? (
        <Card className="p-10 text-center">
          <QrCode className="mx-auto h-10 w-10 text-muted" />
          <h2 className="mt-3 font-semibold">No links to turn into QR codes yet</h2>
          <p className="mt-1 text-sm text-muted">Create a short link first, then generate its QR code here.</p>
          <Button className="mt-4" onClick={() => navigate('/links?create=true')}>
            <Plus className="mr-2 h-4 w-4" /> Create Link
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Card key={link.id} className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <h3 className="truncate font-heading text-sm font-semibold text-ink dark:text-white">{link.title}</h3>
                <p className="mt-1 font-mono text-xs text-brand">/r/{link.code}</p>
                <p className="mt-1 truncate text-xs text-muted">{link.destination_url}</p>
                <Badge variant={link.status} className="mt-3">{link.status}</Badge>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedLink(link)} className="shrink-0">
                <QrCode className="mr-2 h-4 w-4" /> Generate
              </Button>
            </Card>
          ))}
        </div>
      )}

      <QrCodeModal isOpen={!!selectedLink} onClose={() => setSelectedLink(null)} link={selectedLink} />
    </div>
  );
}
