'use client';

import Link from 'next/link';
import {
  FileText,
  BookOpen,
  CheckSquare,
  Zap,
  HelpCircle,
  BarChart3,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

// ─── Tool definition ───────────────────────────────────────────────────────────
interface Tool {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  available: boolean;
  href: string;
  badge?: string;
}

const TOOLS: Tool[] = [
  {
    id: 'exam-paper',
    label: 'Exam Paper Generator',
    description: 'Generate complete, multi-section exam papers with AI. Set question types, marks, difficulty mix, and subject focus.',
    icon: FileText,
    color: 'text-veda-orange',
    bg: 'bg-veda-orange-light',
    available: true,
    href: '/create',
    badge: 'Active',
  },
  {
    id: 'lesson-planner',
    label: 'Lesson Planner',
    description: 'Create structured lesson plans aligned to your curriculum. Set learning objectives, activities, and assessments.',
    icon: BookOpen,
    color: 'text-[#0F766E]',
    bg: 'bg-[#CCFBF1]',
    available: false,
    href: '#',
    badge: 'Coming Soon',
  },
  {
    id: 'rubric-maker',
    label: 'Rubric Maker',
    description: 'Build detailed grading rubrics for any assignment. Define criteria, performance levels, and point values instantly.',
    icon: CheckSquare,
    color: 'text-[#7C3AED]',
    bg: 'bg-[#EDE9FE]',
    available: false,
    href: '#',
    badge: 'Coming Soon',
  },
  {
    id: 'flashcard-creator',
    label: 'Flashcard Creator',
    description: 'Turn your study material into interactive flashcard sets. Perfect for revision and student self-assessment.',
    icon: Zap,
    color: 'text-[#B45309]',
    bg: 'bg-[#FEF3C7]',
    available: false,
    href: '#',
    badge: 'Coming Soon',
  },
  {
    id: 'doubt-resolver',
    label: 'Doubt Resolver',
    description: 'Upload student questions and get clear, curriculum-accurate explanations you can share directly with students.',
    icon: HelpCircle,
    color: 'text-[#0369A1]',
    bg: 'bg-[#E0F2FE]',
    available: false,
    href: '#',
    badge: 'Coming Soon',
  },
  {
    id: 'progress-report',
    label: 'Progress Analyser',
    description: "Generate insightful progress reports for individual students or entire classes. Spot trends and areas of improvement.",
    icon: BarChart3,
    color: 'text-[#DC2626]',
    bg: 'bg-[#FEE2E2]',
    available: false,
    href: '#',
    badge: 'Coming Soon',
  },
];

// ─── Tool Card ─────────────────────────────────────────────────────────────────
function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  const inner = (
    <div
      className={cn(
        'bg-white rounded-[16px] border border-veda-gray-200 p-6 flex flex-col gap-4 h-full transition-all duration-200',
        tool.available
          ? 'hover:shadow-card-hover hover:border-veda-gray-300 cursor-pointer group'
          : 'opacity-75'
      )}
    >
      {/* Icon + badge row */}
      <div className="flex items-start justify-between">
        <div className={cn('w-12 h-12 rounded-[12px] flex items-center justify-center', tool.bg)}>
          <Icon className={cn('w-5.5 h-5.5', tool.color)} strokeWidth={1.8} />
        </div>
        <span
          className={cn(
            'text-[10.5px] font-bold px-2.5 py-1 rounded-full',
            tool.available
              ? 'bg-green-50 text-green-700'
              : 'bg-veda-gray-100 text-veda-gray-400'
          )}
        >
          {tool.badge}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className={cn('text-[14px] font-bold mb-1.5', tool.available ? 'text-veda-gray-900 group-hover:text-veda-orange transition-colors' : 'text-veda-gray-600')}>
          {tool.label}
        </h3>
        <p className="text-[12.5px] text-veda-gray-500 leading-relaxed">{tool.description}</p>
      </div>

      {/* CTA */}
      <div className="pt-2 border-t border-veda-gray-100">
        {tool.available ? (
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-veda-orange group-hover:gap-2.5 transition-all">
            Launch Tool <ArrowRight className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-veda-gray-400">
            <Lock className="w-3.5 h-3.5" />
            Not yet available
          </div>
        )}
      </div>
    </div>
  );

  if (tool.available) {
    return <Link href={tool.href} className="block h-full">{inner}</Link>;
  }
  return <div className="h-full">{inner}</div>;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ToolkitPage() {
  const available = TOOLS.filter((t) => t.available);
  const upcoming = TOOLS.filter((t) => !t.available);

  return (
    <MainLayout>
      <div className="p-6 max-w-[1100px] mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-[8px] bg-veda-orange-light flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-veda-orange" strokeWidth={2} />
            </div>
            <h1 className="text-[22px] font-bold text-veda-gray-900 tracking-tight">AI Teacher&apos;s Toolkit</h1>
          </div>
          <p className="text-[13.5px] text-veda-gray-500 ml-[42px]">
            Powerful AI tools to help you teach smarter, faster.
          </p>
        </div>

        {/* Available Tools */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-[13px] font-bold text-veda-gray-700 uppercase tracking-wider">Available Now</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-veda-gray-300" />
            <h2 className="text-[13px] font-bold text-veda-gray-400 uppercase tracking-wider">Coming Soon</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        {/* Bottom banner */}
        <div className="mt-8 bg-veda-black rounded-[16px] px-7 py-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern bg-dot-md opacity-[0.06]" />
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-veda-orange/20 blur-3xl" />
          <div className="relative z-10">
            <p className="text-white/50 text-[11.5px] font-medium mb-1">Have a suggestion?</p>
            <h3 className="text-[16px] font-bold text-white mb-0.5">Request a new tool</h3>
            <p className="text-white/50 text-[12.5px]">We build tools teachers actually need.</p>
          </div>
          <button className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-white text-veda-black text-[13px] font-semibold rounded-[10px] hover:bg-veda-gray-100 transition-all active:scale-[0.97] shrink-0 ml-6">
            Send Request
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </MainLayout>
  );
}
