import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Radio, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, verifySignupOtp, resendConfirmation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (confirmationEmail) {
      if (!/^\d{6}$/.test(verificationCode)) {
        setError('Enter the 6-digit code from your confirmation email.');
        return;
      }
      setLoading(true);
      const result = await verifySignupOtp(confirmationEmail, verificationCode);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        navigate('/dashboard');
      }
      return;
    }
    setMessage(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const res = await signUpWithEmail(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.message) {
      setMessage(res.message);
      setConfirmationEmail(email.trim());
      setVerificationCode('');
    } else {
      navigate('/dashboard');
    }
  };

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return;
    setResending(true);
    setError(null);
    const result = await resendConfirmation(confirmationEmail);
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
          Create your account
        </h2>
        <p className="mt-1 text-xs text-muted dark:text-muted-dark">
          Verify your email to secure your account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {!isSupabaseConfigured && (
              <p className="rounded-lg border border-border p-3 text-xs text-muted dark:border-border-dark dark:text-muted-dark">
                Email verification is unavailable in local demo mode. Configure Supabase to create an account.
              </p>
            )}
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
                {confirmationEmail && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="ml-6 mt-2 font-medium underline disabled:opacity-60"
                  >
                    {resending ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                )}
              </div>
            )}

            {confirmationEmail && (
              <p className="text-xs text-muted dark:text-muted-dark">
                Enter the 6-digit code sent to <strong>{confirmationEmail}</strong>.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {confirmationEmail ? (
                <div>
                  <label htmlFor="signup-verification-code" className="text-xs font-medium text-ink dark:text-white">
                    Email confirmation code
                  </label>
                  <input
                    id="signup-verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm tracking-[0.3em] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                  />
                </div>
              ) : (
                <>
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
                      placeholder="At least 8 characters"
                      className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full gap-2"
              >
                <span>
                  {loading
                    ? confirmationEmail ? 'Verifying...' : 'Creating Account...'
                    : confirmationEmail ? 'Verify Email' : 'Sign Up'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>
            {confirmationEmail && (
              <button
                type="button"
                onClick={() => {
                  setConfirmationEmail(null);
                  setVerificationCode('');
                  setMessage(null);
                  setError(null);
                }}
                className="w-full text-center text-xs font-medium text-brand hover:underline"
              >
                Use a different email address
              </button>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-border dark:border-border-dark py-4 text-xs text-muted dark:text-muted-dark">
            Already have an account?{' '}
            <Link to="/login" className="ml-1 font-medium text-brand hover:underline">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
