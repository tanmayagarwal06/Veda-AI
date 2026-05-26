'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  back?: string;
}

function getBreadcrumb(pathname: string): Crumb {
  if (pathname === '/') return { label: 'Dashboard' };
  if (pathname === '/assignments') return { label: 'Assignments' };
  if (pathname === '/groups') return { label: 'My Groups' };
  if (pathname === '/toolkit') return { label: "AI Teacher's Toolkit" };
  if (pathname === '/library') return { label: 'My Library' };
  if (pathname === '/settings') return { label: 'Settings' };
  if (pathname === '/create') return { label: 'Assignments', back: '/assignments' };
  if (pathname.startsWith('/paper/')) return { label: 'Assignments', back: '/assignments' };
  return { label: 'VedaAI' };
}

export function Header() {
  const pathname = usePathname();
  const crumb = getBreadcrumb(pathname);

  return (
    <header className="h-[52px] bg-white border-b border-veda-gray-200 flex items-center justify-between px-6 shrink-0 z-30">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        {crumb.back ? (
          <Link
            href={crumb.back}
            className="flex items-center gap-1 text-veda-gray-500 hover:text-veda-gray-900 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            <span>{crumb.label}</span>
          </Link>
        ) : (
          <span className="text-veda-gray-900 font-semibold">{crumb.label}</span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className={cn(
            'relative w-8 h-8 rounded-[8px] flex items-center justify-center',
            'text-veda-gray-500 hover:text-veda-gray-900 hover:bg-veda-gray-100',
            'transition-all duration-150 active:scale-95'
          )}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-veda-orange rounded-full ring-2 ring-white" />
        </button>

        {/* User avatar + name */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-[8px] hover:bg-veda-gray-100 transition-all duration-150 active:scale-95">
          <div className="w-6 h-6 rounded-full bg-gradient-veda flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold">R</span>
          </div>
          <span className="text-[13px] font-medium text-veda-gray-700">Rajesh Kumar</span>
          <ChevronDown className="w-3.5 h-3.5 text-veda-gray-400" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
