import { Menu, Sun, Moon, Plus, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { isFirebaseConfigured } from '@/lib/firebase';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { role, loginDemo, signOut, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-4 md:px-6 dark:border-border-dark dark:bg-surface-dark transition-colors">
      {/* Left: Mobile hamburger + Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink lg:hidden dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-white"
          aria-label="Open sidebar navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted dark:text-muted-dark">
          <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          <span className="font-mono text-ink dark:text-white">api.linkpulse.io</span>
          <span>•</span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Fast Role Switcher for Hackathon Demo */}
        {!isFirebaseConfigured && <div className="hidden md:flex items-center rounded-lg border border-border bg-canvas p-0.5 text-xs font-medium dark:border-border-dark dark:bg-canvas-dark">
          <button
            onClick={() => loginDemo('user')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
              role === 'user'
                ? 'bg-surface text-ink font-semibold shadow-subtle dark:bg-surface-dark dark:text-white'
                : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-white'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>User</span>
          </button>
          <button
            onClick={() => loginDemo('admin')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
              role === 'admin'
                ? 'bg-surface text-ink font-semibold shadow-subtle dark:bg-surface-dark dark:text-white'
                : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-signal" />
            <span>Admin</span>
          </button>
        </div>}

        {/* Quick Create Link Button */}
        <Button
          size="sm"
          variant="primary"
          onClick={() => navigate('/links?create=true')}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Link</span>
        </Button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-white transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Sign Out */}
        <button
          onClick={() => {
            void signOut()
              .then(() => navigate('/login'))
              .catch((error: unknown) => {
                window.alert(error instanceof Error ? error.message : 'Unable to sign out.');
              });
          }}
          className="rounded-lg p-2 text-muted hover:bg-danger-tint hover:text-danger dark:text-muted-dark dark:hover:bg-danger/10 transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
