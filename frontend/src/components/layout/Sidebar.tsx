'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  FileText,
  Sparkles,
  BookOpen,
  Settings,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'My Groups', href: '/groups', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: FileText },
  { label: "AI Teacher's Toolkit", href: '/toolkit', icon: Sparkles },
  { label: 'My Library', href: '/library', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // exact match for top-level pages so /assignments doesn't also match /assignments/…
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[228px] bg-veda-black flex flex-col z-40 select-none">
      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[7px] bg-gradient-veda flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-bold text-[15px] tracking-tight">V</span>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-[-0.01em]">
            VedaAI
          </span>
        </Link>
      </div>

      {/* ── Create Assignment CTA ── */}
      <div className="px-3 pb-4">
        <Link
          href="/create"
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2.5 rounded-[10px]',
            'bg-[#1C1C1E] hover:bg-[#2A2A2C] border border-white/[0.07]',
            'text-white text-[13px] font-medium transition-all duration-150',
            'active:scale-[0.98]',
            pathname === '/create' && 'bg-[#2A2A2C]'
          )}
        >
          <div className="w-5 h-5 rounded-[5px] bg-gradient-veda flex items-center justify-center shrink-0">
            <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
          Create Assignment
        </Link>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[8px] group',
                'text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-white/[0.1] text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                )}
                strokeWidth={active ? 2 : 1.5}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-[10px] font-bold bg-veda-orange text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3 mt-2 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150 text-[13px] font-medium"
        >
          <Settings className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          Settings
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-7 h-7 rounded-full bg-gradient-veda flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-[11px] font-bold">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-[12px] font-medium truncate">Delhi Public School</p>
            <p className="text-white/30 text-[10px] truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
