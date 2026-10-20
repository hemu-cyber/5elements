import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Radio, ArrowRight, ShieldCheck, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginDemo, loginWithEmail, resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemoClick = async (role: 'user' | 'admin') => {
    setLoading(true);
    try {
      await loginDemo(role);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const res = await loginWithEmail(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.message) {
      setMessage(res.message);
      setVerificationEmail(email.trim());
    } else {
      navigate('/dashboard');
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    setResending(true);
    setError(null);
    const result = await resendVerification(verificationEmail, password);
    setResending(false);
    if (result.error) setError(result.error);
    if (result.message) setMessage(result.message);
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/landing" className="inline-flex items-center gap-2 font-heading text-xl font-bold text-ink dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-tint text-brand">
            <Radio className="h-4 w-4" />
          </div>
          <span>LinkPulse</span>
          <span className="h-2 w-2 rounded-full bg-brand animate-pulse-dot" />
        </Link>
        <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-ink dark:text-white">
          Sign in to your account
        </h2>
        {!isFirebaseConfigured && (
          <p className="mt-1 text-xs text-muted dark:text-muted-dark">
            Email sign-in requires Firebase. Use a demo workspace for local testing.
          </p>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {!isFirebaseConfigured && <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoClick('user')}
                disabled={loading}
                className="gap-1.5 text-xs py-2"
              >
                <User className="h-3.5 w-3.5 text-muted" />
                <span>Demo User</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoClick('admin')}
                disabled={loading}
                className="gap-1.5 text-xs py-2"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                <span>Demo Admin</span>
              </Button>
            </div>}

            {!isFirebaseConfigured && <div className="relative flex items-center justify-center text-xs">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border dark:border-border-dark" />
              </div>
              <span className="relative bg-surface px-2 text-muted dark:bg-surface-dark dark:text-muted-dark uppercase tracking-wider text-[10px]">
                or with email
              </span>
            </div>}

            {error && (
              <div className="rounded-lg bg-danger-tint p-3 text-xs text-danger flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div role="status" className="rounded-lg bg-success-tint p-3 text-xs text-success">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
                {verificationEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending || !password}
                    className="ml-6 mt-2 font-medium underline disabled:opacity-60"
                  >
                    {resending ? 'Sending...' : 'Resend verification link'}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-ink dark:text-white">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink dark:text-white">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-border dark:border-border-dark py-4 text-xs text-muted dark:text-muted-dark">
            Don't have an account?{' '}
            <Link to="/signup" className="ml-1 font-medium text-brand hover:underline">
              Sign up
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
