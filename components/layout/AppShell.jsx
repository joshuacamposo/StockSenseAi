'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import { getRoutePermission } from '@/lib/permissions';
import { AccessDeniedState, FullScreenLoader } from '@/components/ui';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import SmartVisualGuide from '@/components/chatbot/SmartVisualGuide';
import WalkthroughOverlay from '@/components/walkthrough/WalkthroughOverlay';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  const { ready, user, canDo } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login');
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <FullScreenLoader label={ready ? 'Redirecting to demo login…' : 'Loading demonstration workspace…'} />;
  }

  const permission = getRoutePermission(pathname);
  const denied = permission ? !canDo(permission) : false;

  return (
    <div className="min-h-screen bg-[#f2f5fa]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[272px]">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          {denied ? <AccessDeniedState /> : children}
          <footer className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-400 sm:flex-row sm:items-center">
            <p className="flex items-center gap-1.5">
              <Info size={12} />
              StockSense AI v1.0 · SA101 AI Automation System · Interactive academic prototype
            </p>
            <p>
              All records are stored in this browser&apos;s localStorage. No server, database, or
              external AI service is connected.
            </p>
          </footer>
        </main>
      </div>
      <WalkthroughOverlay />
      <SmartVisualGuide />
      <ChatbotWidget />
    </div>
  );
}
