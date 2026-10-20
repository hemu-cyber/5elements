import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  FolderKanban,
  QrCode,
  BarChart3,
  ShieldAlert,
  Settings,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Links', to: '/links', icon: Link2 },
    { name: 'Campaigns', to: '/campaigns', icon: FolderKanban },
    { name: 'QR Codes', to: '/qr-codes', icon: QrCode },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    ...(isAdmin
      ? [{ name: 'Admin', to: '/admin', icon: ShieldAlert, badge: 'PRO' }]
      : []),
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#14181F] text-slate-300 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 border-r border-[#232B36]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo and Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#232B36]">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight text-white focus:outline-none"
            onClick={onClose}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0AA5E8]/10 text-[#0AA5E8] border border-[#0AA5E8]/30">
              <Radio className="h-4 w-4 text-[#0AA5E8]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>LinkPulse</span>
              <span className="h-2 w-2 rounded-full bg-[#0AA5E8] animate-pulse-dot" />
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#232B36] hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'bg-[#2B323C] text-white font-semibold'
                    : 'text-slate-400 hover:bg-[#232B36] hover:text-slate-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-[#0AA5E8]" />
                  )}
                  <item.icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-[#0AA5E8]' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="rounded bg-[#FF7A1A]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#FF7A1A]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom User / Session Section */}
        <div className="border-t border-[#232B36] p-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#1B222B] p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0AA5E8]/20 text-xs font-semibold text-[#0AA5E8]">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-white">{user?.email || 'Anonymous'}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                  {user?.role || 'Guest'}
                </span>
                {user?.role === 'admin' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0AA5E8]" />
                )}
              </div>
            </div>
            <NavLink
              to="/landing"
              target="_blank"
              rel="noreferrer"
              title="View Public Site"
              className="text-slate-400 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
