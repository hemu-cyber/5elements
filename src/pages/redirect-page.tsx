import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  resolveRedirect,
  unlockLinkWithPassword,
  RedirectResult,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  ShieldAlert,
  Clock,
  Lock,
  Ban,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function RedirectPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<RedirectResult | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);

  useEffect(() => {
    if (!code) return;
    const res = resolveRedirect(code, {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });
    setResult(res);

    if (res.type === 'REDIRECT') {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = res.destination_url;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [code]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-canvas-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span className="text-xs font-mono text-muted">Resolving edge redirect...</span>
        </div>
      </div>
    );
  }

  // Rule 1: Link Not Found
  if (result.type === 'NOT_FOUND') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 text-center dark:bg-canvas-dark">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-tint border border-danger/20 text-danger">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <Badge variant="disabled" className="mb-2 font-mono text-xs">
          HTTP 404 • Not Found
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-ink dark:text-white">
          Short Link Not Found
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted dark:text-muted-dark">
          The short link <span className="font-mono text-brand font-semibold">/r/{code}</span> does not exist or has been deleted.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Go to LinkPulse
          </Button>
        </div>
      </div>
    );
  }

  // Rule 2: Status Disabled
  if (result.type === 'DISABLED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 text-center dark:bg-canvas-dark">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-tint border border-danger/20 text-danger">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <Badge variant="disabled" className="mb-2 font-mono text-xs">
          HTTP 410 • Disabled
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-ink dark:text-white">
          Link Disabled by Administrator
        </h1>
        <div className="mt-4 max-w-md rounded-xl border border-danger/20 bg-danger-tint/50 p-4 text-xs text-danger text-left">
          <strong>Enforcement Notice:</strong> {result.reason}
        </div>
        <p className="mt-3 text-xs text-muted dark:text-muted-dark">
          Traffic resolution has been halted globally across Netlify Edge nodes. Historical metrics remain preserved.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Rule 3: Destination Domain Blocklisted
  if (result.type === 'BLOCKLISTED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 text-center dark:bg-canvas-dark">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-tint border border-danger/20 text-danger">
          <Ban className="h-8 w-8" />
        </div>
        <Badge variant="disabled" className="mb-2 font-mono text-xs">
          HTTP 403 • Domain Blocklisted
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-ink dark:text-white">
          Destination Blocked for Safety
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted dark:text-muted-dark">
          The destination domain <strong className="font-mono text-danger">{result.domain}</strong> is on the platform safety blocklist.
        </p>
        <div className="mt-4 max-w-md rounded-xl border border-border bg-surface p-4 text-xs text-left dark:border-border-dark dark:bg-surface-dark">
          <span className="font-semibold text-ink dark:text-white">Reason for block:</span>
          <p className="mt-1 text-muted dark:text-muted-dark">{result.reason}</p>
        </div>
      </div>
    );
  }

  // Rule 4: Expired
  if (result.type === 'EXPIRED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 text-center dark:bg-canvas-dark">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-canvas border border-border text-muted dark:border-border-dark">
          <Clock className="h-8 w-8" />
        </div>
        <Badge variant="expired" className="mb-2 font-mono text-xs">
          HTTP 410 • Link Expired
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-ink dark:text-white">
          This Link Has Expired
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted dark:text-muted-dark">
          The creator configured an expiration date for <span className="font-mono text-brand">/r/{code}</span> which lapsed on{' '}
          <strong>{new Date(result.expires_at).toLocaleString()}</strong>.
        </p>
      </div>
    );
  }

  // Rule 5: Click Limit Reached
  if (result.type === 'LIMIT_REACHED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 text-center dark:bg-canvas-dark">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-tint border border-warning/20 text-warning">
          <Clock className="h-8 w-8" />
        </div>
        <Badge variant="limited" className="mb-2 font-mono text-xs">
          HTTP 429 • Click Cap Reached
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-ink dark:text-white">
          Link Click Limit Reached
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted dark:text-muted-dark">
          This link was capped at a maximum of <strong>{result.limit}</strong> clicks. The atomic concurrency threshold has been reached.
        </p>
      </div>
    );
  }

  // Rule 6: Password Required
  if (result.type === 'PASSWORD_REQUIRED') {
    const handleUnlockSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const success = unlockLinkWithPassword(result.code, passwordInput);
      if (success) {
        setPasswordError(false);
        const res = resolveRedirect(result.code);
        setResult(res);
        if (res.type === 'REDIRECT') {
          window.location.href = res.destination_url;
        }
      } else {
        setPasswordError(true);
      }
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 dark:bg-canvas-dark">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint border border-brand/20 text-brand">
            <Lock className="h-7 w-7" />
          </div>
          <Badge variant="brand" className="mb-2 font-mono text-xs">
            Password Protected Link
          </Badge>
          <h2 className="font-heading text-2xl font-bold text-ink dark:text-white">
            Enter Link Passphrase
          </h2>
          <p className="mt-1 text-xs text-muted dark:text-muted-dark">
            This short link is encrypted. Enter the passphrase provided by the creator to unlock the destination.
          </p>

          <form onSubmit={handleUnlockSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-ink dark:text-white">
                Passphrase
              </label>
              <input
                type="password"
                required
                placeholder="Enter password (hint for demo: secret123)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`mt-1.5 w-full rounded-lg border bg-canvas px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none dark:bg-canvas-dark dark:text-white ${
                  passwordError
                    ? 'border-danger focus:border-danger'
                    : 'border-border focus:border-brand dark:border-border-dark'
                }`}
              />
              {passwordError && (
                <p className="mt-1 text-xs text-danger">
                  Incorrect passphrase. Please try again.
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full gap-2">
              <span>Unlock & Proceed</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Rule 7 & 8: Successful Redirection with Live Preview
  if (result.type === 'REDIRECT') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 text-center dark:bg-canvas-dark">
        <Card className="w-full max-w-lg p-8 shadow-modal">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-tint border border-success/20 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <Badge variant="active" dot className="mb-2 font-mono text-xs">
            302 Found • Redirecting
          </Badge>
          <h1 className="font-heading text-2xl font-bold text-ink dark:text-white">
            Redirecting to Destination
          </h1>
          <p className="mt-1 font-mono text-xs text-brand">/r/{code}</p>

          <div className="mt-4 rounded-xl border border-border bg-canvas p-4 text-xs dark:border-border-dark dark:bg-canvas-dark break-all font-mono text-muted">
            {result.destination_url}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-xs text-muted dark:text-muted-dark">
              Automated jump in <strong className="font-mono text-brand text-sm">{redirectCountdown}s</strong>... (Click logged to analytics)
            </p>
            <div className="flex items-center gap-3 w-full">
              <Button
                variant="primary"
                onClick={() => (window.location.href = result.destination_url)}
                className="w-full gap-2 text-sm py-2.5"
              >
                <span>Proceed Immediately</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
