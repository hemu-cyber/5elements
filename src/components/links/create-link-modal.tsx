import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Clock,
  Smartphone,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getLinks,
  saveLinks,
  getCampaigns,
  generateBase62Code,
  validateAlias,
  validateDestinationUrl,
  logAudit,
} from '@/lib/store';
import { Link as LinkType } from '@/types/database';
import { useAuth } from '@/lib/auth-context';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkCreated: (newLink: LinkType) => void;
}

export function CreateLinkModal({ isOpen, onClose, onLinkCreated }: CreateLinkModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State
  const [destinationUrl, setDestinationUrl] = useState('');
  const [title, setTitle] = useState('');
  const [aliasType, setAliasType] = useState<'auto' | 'custom'>('auto');
  const [customAlias, setCustomAlias] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [aliasError, setAliasError] = useState<string | null>(null);

  // Step 2 State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [clickLimit, setClickLimit] = useState<string>('');
  const [password, setPassword] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');

  // UTM Builder
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const campaigns = getCampaigns();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDestinationUrl('');
      setTitle('');
      setAliasType('auto');
      setCustomAlias(generateBase62Code(7));
      setUrlError(null);
      setAliasError(null);
      setSelectedCampaignId('');
      setExpiryDate('');
      setClickLimit('');
      setPassword('');
      setIosUrl('');
      setAndroidUrl('');
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
    }
  }, [isOpen]);

  // Auto-fill utm_campaign when campaign is selected
  useEffect(() => {
    if (selectedCampaignId) {
      const camp = campaigns.find((c) => c.id === selectedCampaignId);
      if (camp) {
        setUtmCampaign(camp.name.toLowerCase().replace(/\s+/g, '-'));
      }
    }
  }, [selectedCampaignId, campaigns]);

  if (!isOpen) return null;

  const handleUrlChange = (val: string) => {
    setDestinationUrl(val);
    if (!val) {
      setUrlError(null);
      return;
    }
    const check = validateDestinationUrl(val);
    if (!check.valid) {
      setUrlError(check.error || 'Invalid URL');
    } else {
      setUrlError(null);
      if (!title) {
        try {
          const u = new URL(val);
          setTitle(u.hostname.replace('www.', '') + ' Link');
        } catch {
          // ignore
        }
      }
    }
  };

  const handleCustomAliasChange = (val: string) => {
    setCustomAlias(val);
    if (!val) {
      setAliasError('Alias cannot be empty.');
      return;
    }
    const check = validateAlias(val);
    if (!check.valid) {
      setAliasError(check.error || 'Invalid alias');
    } else {
      setAliasError(null);
    }
  };

  const handleRegenerateCode = () => {
    const code = generateBase62Code(7);
    setCustomAlias(code);
    setAliasError(null);
  };

  const handleNextStep = () => {
    // Validate Step 1
    const urlCheck = validateDestinationUrl(destinationUrl);
    if (!urlCheck.valid) {
      setUrlError(urlCheck.error || 'Please enter a valid destination URL.');
      return;
    }
    const finalCode = aliasType === 'auto' ? (customAlias || generateBase62Code(7)) : customAlias;
    const aliasCheck = validateAlias(finalCode);
    if (!aliasCheck.valid) {
      setAliasError(aliasCheck.error || 'Invalid alias');
      return;
    }
    setStep(2);
  };

  const handlePublish = () => {
    // Build final destination with UTMs if provided
    let finalDestination = destinationUrl;
    try {
      const u = new URL(destinationUrl);
      if (utmSource) u.searchParams.set('utm_source', utmSource);
      if (utmMedium) u.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) u.searchParams.set('utm_campaign', utmCampaign);
      finalDestination = u.toString();
    } catch {
      // keep raw
    }

    const finalCode = (aliasType === 'auto' ? customAlias || generateBase62Code(7) : customAlias).trim();

    const newLink: LinkType = {
      id: 'link-' + Date.now(),
      user_id: user?.id || '00000000-0000-0000-0000-000000000001',
      campaign_id: selectedCampaignId || null,
      code: finalCode,
      destination_url: finalDestination,
      title: title.trim() || 'Short Link /r/' + finalCode,
      status: 'active',
      click_count: 0,
      click_limit: clickLimit ? parseInt(clickLimit, 10) : null,
      password_hash: password ? password.trim() : null,
      expires_at: expiryDate ? new Date(expiryDate).toISOString() : null,
      ios_url: iosUrl.trim() || null,
      android_url: androidUrl.trim() || null,
      created_at: new Date().toISOString(),
    };

    const links = getLinks();
    links.unshift(newLink);
    saveLinks(links);

    logAudit('link.create', 'link', newLink.id, {
      code: newLink.code,
      destination: newLink.destination_url,
    }, user?.email);

    onLinkCreated(newLink);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark shadow-modal flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border-dark">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-ink dark:text-white">
                Create Short Link
              </h2>
              <Badge variant="brand" className="text-[10px] font-mono">
                Step {step} of 2
              </Badge>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark mt-0.5">
              {step === 1
                ? 'Configure destination address and short alias.'
                : 'Set campaign, rules, expiry caps, and UTM tracking.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <>
              {/* Destination URL */}
              <div>
                <label className="text-xs font-semibold text-ink dark:text-white flex items-center justify-between">
                  <span>Destination URL *</span>
                  <span className="text-[10px] text-muted font-normal">HTTP / HTTPS</span>
                </label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com/promotion"
                  value={destinationUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={`mt-1.5 w-full rounded-lg border bg-canvas px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 dark:bg-canvas-dark dark:text-white ${
                    urlError
                      ? 'border-danger focus:border-danger focus:ring-danger'
                      : 'border-border focus:border-brand focus:ring-brand dark:border-border-dark'
                  }`}
                />
                {urlError ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{urlError}</span>
                  </p>
                ) : destinationUrl ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Valid destination URL</span>
                  </p>
                ) : null}
              </div>

              {/* Title / Label */}
              <div>
                <label className="text-xs font-semibold text-ink dark:text-white">
                  Link Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Campaign Banner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                />
              </div>

              {/* Short Alias Selection */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink dark:text-white">
                    Short Alias Code *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAliasType('auto');
                        handleRegenerateCode();
                      }}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        aliasType === 'auto'
                          ? 'bg-brand-tint text-brand font-semibold'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      Auto-generate
                    </button>
                    <button
                      type="button"
                      onClick={() => setAliasType('custom')}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        aliasType === 'custom'
                          ? 'bg-brand-tint text-brand font-semibold'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      Custom Alias
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center rounded-lg border border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark">
                  <span className="px-3 text-xs font-mono text-muted border-r border-border dark:border-border-dark select-none">
                    {window.location.host}/r/
                  </span>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => handleCustomAliasChange(e.target.value)}
                    placeholder="my-link"
                    className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-ink focus:outline-none dark:text-white"
                  />
                  {aliasType === 'auto' && (
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="px-3 text-xs text-brand hover:underline font-medium"
                      title="Re-roll randomized base62 code"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {aliasError ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{aliasError}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-muted">
                    Preview:{' '}
                    <span className="font-mono text-brand font-medium">
                      {window.location.origin}/r/{customAlias || '...'}
                    </span>
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Campaign Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink dark:text-white flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-brand" />
                    <span>Campaign</span>
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                  >
                    <option value="">No Campaign (Standalone)</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="text-xs font-semibold text-ink dark:text-white flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-warning" />
                    <span>Expiration Date</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                  />
                </div>
              </div>

              {/* Click Limit & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink dark:text-white flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-signal" />
                    <span>Click Cap / Limit</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={clickLimit}
                    onChange={(e) => setClickLimit(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                  />
                  <span className="text-[10px] text-muted">Atomic race-safe cutoff</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink dark:text-white flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-brand" />
                    <span>Password Protection</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional secret passphrase"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                  />
                  <span className="text-[10px] text-muted">Prompts unlock page before redirect</span>
                </div>
              </div>

              {/* Device Targeting */}
              <div className="rounded-xl border border-border p-4 bg-canvas/50 dark:border-border-dark dark:bg-canvas-dark/50 space-y-3">
                <span className="text-xs font-semibold text-ink dark:text-white flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-brand" />
                  <span>Device Specific Overrides</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted font-medium">iOS Destination</label>
                    <input
                      type="url"
                      placeholder="https://apps.apple.com/..."
                      value={iosUrl}
                      onChange={(e) => setIosUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-surface-dark dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted font-medium">Android Destination</label>
                    <input
                      type="url"
                      placeholder="https://play.google.com/..."
                      value={androidUrl}
                      onChange={(e) => setAndroidUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-border-dark dark:bg-surface-dark dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* UTM Builder */}
              <div className="rounded-xl border border-border p-4 bg-canvas/50 dark:border-border-dark dark:bg-canvas-dark/50 space-y-3">
                <span className="text-xs font-semibold text-ink dark:text-white">
                  UTM Campaign Builder
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-muted">Source</label>
                    <input
                      type="text"
                      placeholder="newsletter"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink dark:border-border-dark dark:bg-surface-dark dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted">Medium</label>
                    <input
                      type="text"
                      placeholder="email"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink dark:border-border-dark dark:bg-surface-dark dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted">Campaign</label>
                    <input
                      type="text"
                      placeholder="launch"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink dark:border-border-dark dark:bg-surface-dark dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border dark:border-border-dark bg-canvas/30 dark:bg-canvas-dark/30">
          {step === 1 ? (
            <div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setStep(1)} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>
          )}

          {step === 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNextStep}
              disabled={!destinationUrl || !!urlError}
              className="gap-1.5"
            >
              <span>Continue to Rules & UTM</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublish}
              className="gap-1.5 font-semibold"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Publish Short Link</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
