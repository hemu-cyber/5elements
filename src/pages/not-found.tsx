import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12 text-center dark:bg-canvas-dark">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint border border-brand/20 text-brand">
        <Compass className="h-8 w-8 animate-pulse-dot" />
      </div>
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-brand">
        Error 404
      </span>
      <h1 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl dark:text-white">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted dark:text-muted-dark">
        The route or resource you are looking for does not exist or may have been permanently moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </Button>
        <Button variant="primary" onClick={() => navigate('/dashboard')} className="gap-2">
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
      </div>
    </div>
  );
}
