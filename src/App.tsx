import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from '@/components/layout/route-guards';
import { LandingPage } from '@/pages/landing';
import { LoginPage } from '@/pages/login';
import { SignUpPage } from '@/pages/signup';
import { DashboardPage } from '@/pages/dashboard';
import { LinksPage } from '@/pages/links';
import { CampaignsPage } from '@/pages/campaigns';
import { QrCodesPage } from '@/pages/qr-codes';
import { AnalyticsPage } from '@/pages/analytics';
import { AdminPage } from '@/pages/admin';
import { SettingsPage } from '@/pages/settings';
import { NotFoundPage } from '@/pages/not-found';
import { RedirectPage } from '@/pages/redirect-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/r/:code" element={<RedirectPage />} />
            
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/links" element={<LinksPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/qr-codes" element={<QrCodesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
