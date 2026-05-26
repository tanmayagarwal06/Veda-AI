'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Sparkles,
  TrendingUp,
  BookOpen,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { assignmentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/types/index';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-[14px] border border-veda-gray-200 p-5 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200">
      <div className={cn('w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
      </div>
      <div>
        {loading ? (
          <div className="h-6 w-12 bg-veda-gray-100 rounded-full animate-pulse mb-1" />
        ) : (
          <p className="text-[22px] font-bold text-veda-gray-900 leading-tight tabular-nums">{value}</p>
        )}
        <p className="text-[12px] text-veda-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function RecentRow({ assignment }: { assignment: Assignment }) {
  const statusColor =
    assignment.status === 'done'
      ? 'text-green-600 bg-green-50'
      : assignment.status === 'processing'
      ? 'text-amber-600 bg-amber-50'
      : assignment.status === 'failed'
      ? 'text-red-600 bg-red-50'
      : 'text-veda-gray-500 bg-veda-gray-100';

  const statusLabel =
    assignment.status === 'done'
      ? 'Done'
      : assignment.status === 'processing'
      ? 'Processing'
      : assignment.status === 'failed'
      ? 'Failed'
      : 'Pending';

  const totalQ = assignment.questionTypes?.reduce((s, q) => s + q.numberOfQuestions, 0) ?? 0;

  return (
    <Link
      href={assignment.status === 'done' ? `/paper/${assignment._id}` : `/assignments`}
      className="flex items-center gap-4 px-4 py-3 rounded-[10px] hover:bg-veda-gray-50 transition-all duration-150 group"
    >
      <div className="w-9 h-9 rounded-[8px] bg-veda-orange-light flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-veda-orange" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-veda-gray-900 truncate group-hover:text-veda-orange transition-colors">
          {assignment.subject}
        </p>
        <p className="text-[11.5px] text-veda-gray-400">
          {totalQ} question{totalQ !== 1 ? 's' : ''} · Due{' '}
          {new Date(assignment.dueDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>
      <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0', statusColor)}>
        {statusLabel}
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-veda-gray-300 shrink-0 group-hover:text-veda-orange transition-colors" />
    </Link>
  );
}

function QuickAction({
  label,
  description,
  icon: Icon,
  href,
  gradient,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-[14px] border border-veda-gray-200 p-5 hover:shadow-card-hover hover:border-veda-gray-300 transition-all duration-200 group flex flex-col gap-3"
    >
      <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center', gradient)}>
        <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[13.5px] font-bold text-veda-gray-900 group-hover:text-veda-orange transition-colors mb-0.5">
          {label}
        </p>
        <p className="text-[12px] text-veda-gray-500 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-[12px] font-medium text-veda-orange mt-auto">
        Get started <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = useCallback(async () => {
    try {
      const data = await assignmentsApi.list();
      setAssignments(data);
    } catch {
      // fail silently on home page
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const totalDone = assignments.filter((a) => a.status === 'done').length;
  const totalQ = assignments.reduce(
    (s, a) => s + (a.questionTypes?.reduce((sq, q) => sq + q.numberOfQuestions, 0) ?? 0),
    0
  );
  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="p-6 max-w-[1100px] mx-auto space-y-6">

        <div className="relative bg-veda-black rounded-[18px] overflow-hidden px-7 py-6 flex items-center justify-between">

          <div className="absolute inset-0 bg-dot-pattern bg-dot-md opacity-[0.06]" />

          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-veda-orange/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-white/50 text-[12px] font-medium mb-1 tracking-wide uppercase">Welcome back</p>
            <h1 className="text-[22px] font-bold text-white tracking-tight mb-1">
              Delhi Public School 👋
            </h1>
            <p className="text-white/50 text-[13px]">
              You have{' '}
              <span className="text-white font-semibold">{assignments.length}</span> assignment
              {assignments.length !== 1 ? 's' : ''} total,{' '}
              <span className="text-veda-orange font-semibold">{totalDone}</span> completed.
            </p>
          </div>

          <Link
            href="/create"
            className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-gradient-veda rounded-[10px] text-white text-[13px] font-semibold shadow-lg hover:opacity-90 transition-all active:scale-[0.97] shrink-0 ml-6"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New Assignment
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Assignments"
            value={assignments.length}
            icon={FileText}
            color="bg-veda-black"
            loading={loading}
          />
          <StatCard
            label="Papers Generated"
            value={totalDone}
            icon={CheckCircle2}
            color="bg-gradient-veda"
            loading={loading}
          />
          <StatCard
            label="Total Questions"
            value={totalQ}
            icon={TrendingUp}
            color="bg-[#0F766E]"
            loading={loading}
          />
          <StatCard
            label="AI Generations"
            value={totalDone}
            icon={Sparkles}
            color="bg-[#7C3AED]"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <div className="lg:col-span-2 bg-white rounded-[14px] border border-veda-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-veda-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-veda-gray-400" strokeWidth={1.8} />
                <h2 className="text-[14px] font-bold text-veda-gray-900">Recent Assignments</h2>
              </div>
              <Link
                href="/assignments"
                className="flex items-center gap-1 text-[12px] font-medium text-veda-orange hover:text-veda-orange-hover transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-veda-gray-100 rounded-[8px] animate-pulse" />
                ))}
              </div>
            ) : recentAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-veda-gray-100 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-veda-gray-400" strokeWidth={1.5} />
                </div>
                <p className="text-[13.5px] font-semibold text-veda-gray-700 mb-1">No assignments yet</p>
                <p className="text-[12px] text-veda-gray-400 mb-4">Create your first AI-powered exam paper</p>
                <Link
                  href="/create"
                  className="flex items-center gap-2 px-4 py-2 bg-veda-black text-white text-[12.5px] font-medium rounded-[8px] hover:bg-[#2A2A2A] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Create Assignment
                </Link>
              </div>
            ) : (
              <div className="p-2">
                {recentAssignments.map((a) => (
                  <RecentRow key={a._id} assignment={a} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-[14px] font-bold text-veda-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-veda-orange" strokeWidth={2} />
              Quick Actions
            </h2>
            <QuickAction
              label="Create Assignment"
              description="Generate AI-powered exam papers with custom question types"
              icon={Plus}
              href="/create"
              gradient="bg-gradient-veda"
            />
            <QuickAction
              label="AI Toolkit"
              description="Lesson planner, rubric maker, and more teaching tools"
              icon={Sparkles}
              href="/toolkit"
              gradient="bg-[#7C3AED]"
            />
            <QuickAction
              label="My Library"
              description="Browse and re-use your previously generated papers"
              icon={BookOpen}
              href="/library"
              gradient="bg-[#0F766E]"
            />
            <QuickAction
              label="My Groups"
              description="Organise students into classes and track progress"
              icon={Users}
              href="/groups"
              gradient="bg-[#0369A1]"
            />
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-veda-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-veda-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-veda-orange" strokeWidth={1.8} />
              <h2 className="text-[14px] font-bold text-veda-gray-900">AI Teacher&apos;s Toolkit</h2>
            </div>
            <Link
              href="/toolkit"
              className="flex items-center gap-1 text-[12px] font-medium text-veda-orange hover:text-veda-orange-hover transition-colors"
            >
              Explore <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-veda-gray-100">
            {[
              { label: 'Exam Paper Generator', icon: FileText, available: true, href: '/create' },
              { label: 'Lesson Planner', icon: BookOpen, available: false, href: '/toolkit' },
              { label: 'Rubric Maker', icon: CheckCircle2, available: false, href: '/toolkit' },
              { label: 'Flashcard Creator', icon: Zap, available: false, href: '/toolkit' },
              { label: 'Doubt Resolver', icon: Sparkles, available: false, href: '/toolkit' },
              { label: 'Progress Report', icon: TrendingUp, available: false, href: '/toolkit' },
            ].map(({ label, icon: Icon, available, href }) => (
              <Link
                key={label}
                href={href}
                className="bg-white flex flex-col items-center text-center gap-2.5 p-5 hover:bg-veda-gray-50 transition-all duration-150 group"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-[10px] flex items-center justify-center transition-all',
                    available
                      ? 'bg-veda-orange-light group-hover:bg-veda-orange group-hover:scale-105'
                      : 'bg-veda-gray-100 group-hover:bg-veda-gray-200'
                  )}
                >
                  <Icon
                    className={cn('w-4.5 h-4.5', available ? 'text-veda-orange group-hover:text-white' : 'text-veda-gray-400')}
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-veda-gray-700 leading-tight">{label}</p>
                  {!available && (
                    <span className="text-[10px] text-veda-gray-400 font-medium">Coming soon</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
