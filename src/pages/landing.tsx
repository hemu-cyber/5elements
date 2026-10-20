import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export function LandingPage() {
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const handleTryDemo = async (role: 'user' | 'admin' = 'user') => {
    await loginDemo(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-white flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-6 py-4">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <div className="flex items-center gap-2.5 font-heading text-lg font-bold text-ink dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-tint text-brand">
              <Radio className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>LinkPulse</span>
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse-dot" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => isFirebaseConfigured ? navigate('/signup') : handleTryDemo('user')}
              className="gap-1.5"
            >
              <span>{isFirebaseConfigured ? 'Create Account' : 'Try Demo'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 px-6 py-16 md:py-24 max-w-[1280px] mx-auto flex flex-col items-center text-center">
        <Badge variant="brand" className="mb-4 text-xs font-mono px-3 py-1">
          Hackathon Edition • Netlify Edge + Firebase Auth
        </Badge>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink dark:text-white max-w-3xl">
          Deterministic Link Control. Real-Time Visitor Telemetry.
        </h1>
        <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted dark:text-muted-dark leading-relaxed">
          LinkPulse delivers sub-millisecond edge redirects, strict rule enforcement, atomic click limits, and deep visitor analytics without third-party bloat or fabricated numbers.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {isFirebaseConfigured ? (
            <>
              <Button variant="primary" size="lg" onClick={() => navigate('/signup')} className="gap-2 text-sm">
                <span>Create your account</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/login')} className="gap-2 text-sm">
                <span>Sign in</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" size="lg" onClick={() => handleTryDemo('user')} className="gap-2 text-sm">
                <span>Launch Demo (User)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => handleTryDemo('admin')} className="gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-signal" />
                <span>Launch Demo (Admin)</span>
              </Button>
            </>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-subtle dark:border-border-dark dark:bg-surface-dark">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-semibold text-ink dark:text-white">
              Deterministic 8-Step Engine
            </h3>
            <p className="mt-2 text-xs text-muted dark:text-muted-dark leading-relaxed">
              Enforces blocklists, expirations, atomic concurrency limits, and signed cookie passwords at the Netlify Edge with zero latency overhead.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-subtle dark:border-border-dark dark:bg-surface-dark">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-semibold text-ink dark:text-white">
              Pure Real Data
            </h3>
            <p className="mt-2 text-xs text-muted dark:text-muted-dark leading-relaxed">
              Every metric, click timeline, and referrer breakdown is calculated directly from actual database rows. Automated bot exclusion keeps metrics clean.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-subtle dark:border-border-dark dark:bg-surface-dark">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-base font-semibold text-ink dark:text-white">
              Instant Killswitch
            </h3>
            <p className="mt-2 text-xs text-muted dark:text-muted-dark leading-relaxed">
              Admins can immediately block abusive links or malicious destination domains, instantly halting traffic worldwide while retaining complete historical analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-6 py-6 text-center text-xs text-muted dark:text-muted-dark">
        LinkPulse — Built for Hackathon Excellence. All features run on real data.
      </footer>
    </div>
  );
}
