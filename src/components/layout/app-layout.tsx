import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-white transition-colors">
      {/* 240px Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Body Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Content Container (8px grid, 24px padding, 1280px max width) */}
        <main className="flex-1 px-4 sm:px-6 py-6 mx-auto w-full max-w-[1280px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border dark:border-border-dark pb-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">
          {description}
        </p>
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
