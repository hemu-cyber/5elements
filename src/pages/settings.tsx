import { PageHeader } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { Moon, Sun, Zap } from 'lucide-react';

export function SettingsPage() {
  const { user, role, theme, toggleTheme } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage workspace preferences, developer API tokens, and appearance."
      />

      {/* Account Profile Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border dark:border-border-dark">
          <CardTitle className="text-base font-semibold">Account Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted dark:text-muted-dark">
                Email Address
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'alex@linkpulse.io'}
                className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink opacity-80 dark:border-border-dark dark:bg-canvas-dark dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted dark:text-muted-dark">
                Access Tier & Role
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  disabled
                  value={role?.toUpperCase() || 'USER'}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-mono text-ink opacity-80 dark:border-border-dark dark:bg-canvas-dark dark:text-white"
                />
                <Badge variant={role === 'admin' ? 'brand' : 'neutral'}>
                  {role === 'admin' ? 'Administrator' : 'Standard'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Theme */}
      <Card>
        <CardHeader className="pb-3 border-b border-border dark:border-border-dark">
          <CardTitle className="text-base font-semibold">Interface Appearance</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink dark:text-white">Dark Mode</p>
            <p className="text-xs text-muted dark:text-muted-dark">
              Calibrated dark theme with high-contrast neutral surfaces.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{theme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode'}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Traffic Simulator Demo Tool (Phase 6 hook) */}
      <Card>
        <CardHeader className="pb-3 border-b border-border dark:border-border-dark">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-signal" />
            <CardTitle className="text-base font-semibold">Demo Traffic Simulator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink dark:text-white">
              Generate Synthetic Edge Clicks
            </p>
            <p className="text-xs text-muted dark:text-muted-dark">
              Dispatches realistic visitor traffic through the actual click logging pipeline for testing.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Zap className="h-3.5 w-3.5 text-signal" />
            <span>Simulate Traffic</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
