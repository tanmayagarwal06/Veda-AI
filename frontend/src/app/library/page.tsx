'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  Hash,
  Star,
  StarOff,
  Filter,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { assignmentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/types/index';

// ─── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', color)}>
      {label}
    </span>
  );
}

// ─── Paper Card ────────────────────────────────────────────────────────────────
function PaperCard({
  assignment,
  starred,
  onToggleStar,
}: {
  assignment: Assignment;
  starred: boolean;
  onToggleStar: (id: string) => void;
}) {
  const totalQ = assignment.questionTypes?.reduce((s, q) => s + q.numberOfQuestions, 0) ?? 0;
  const totalM = assignment.questionTypes?.reduce((s, q) => s + q.numberOfQuestions * q.marksPerQuestion, 0) ?? 0;
  const types = assignment.questionTypes?.map((q) => q.type) ?? [];

  return (
    <div className="bg-white rounded-[14px] border border-veda-gray-200 p-5 hover:shadow-card-hover transition-all duration-200 group flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[10px] bg-veda-orange-light flex items-center justify-center shrink-0">
            <FileText className="w-4.5 h-4.5 text-veda-orange" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-bold text-veda-gray-900 truncate group-hover:text-veda-orange transition-colors">
              {assignment.subject}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11.5px] text-veda-gray-400">
              <Calendar className="w-3 h-3" />
              Due {new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggleStar(assignment._id)}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-veda-gray-300 hover:text-amber-400 hover:bg-amber-50 transition-all shrink-0"
        >
          {starred
            ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            : <StarOff className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px]">
        <div className="flex items-center gap-1.5 text-veda-gray-500">
          <Hash className="w-3 h-3" />
          <span className="font-semibold text-veda-gray-900">{totalQ}</span> questions
        </div>
        <div className="w-px h-3.5 bg-veda-gray-200" />
        <div className="flex items-center gap-1.5 text-veda-gray-500">
          <span className="font-semibold text-veda-gray-900">{totalM}</span> marks
        </div>
      </div>

      {/* Type chips */}
      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {types.slice(0, 3).map((t) => (
            <span key={t} className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-veda-gray-100 text-veda-gray-600">
              {t}
            </span>
          ))}
          {types.length > 3 && (
            <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-veda-gray-100 text-veda-gray-400">
              +{types.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-veda-gray-100">
        <Link
          href={`/paper/${assignment._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] border border-veda-gray-200 text-[12px] font-medium text-veda-gray-700 hover:bg-veda-gray-50 hover:border-veda-gray-300 transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
        <Link
          href={`/paper/${assignment._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-veda-black text-white text-[12px] font-medium hover:bg-[#2A2A2A] transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </Link>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-[14px] border border-veda-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[10px] bg-veda-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-veda-gray-100 rounded-full w-3/4" />
          <div className="h-3 bg-veda-gray-100 rounded-full w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-veda-gray-100 rounded-full w-1/3 mb-3" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-veda-gray-100 rounded-full w-16" />
        <div className="h-5 bg-veda-gray-100 rounded-full w-20" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-veda-gray-100">
        <div className="flex-1 h-8 bg-veda-gray-100 rounded-[8px]" />
        <div className="flex-1 h-8 bg-veda-gray-100 rounded-[8px]" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type Tab = 'all' | 'starred';

export default function LibraryPage() {
  const [papers, setPapers] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await assignmentsApi.list();
      // Library only shows completed papers
      setPapers(data.filter((a) => a.status === 'done'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const displayed = papers
    .filter((p) => tab === 'starred' ? starred.has(p._id) : true)
    .filter((p) => p.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <MainLayout>
      <div className="p-6 max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-veda-gray-900 tracking-tight mb-1">My Library</h1>
            <p className="text-[13.5px] text-veda-gray-500">All your generated exam papers in one place</p>
          </div>
          <button
            onClick={load}
            className="w-9 h-9 rounded-[8px] border border-veda-gray-200 bg-white flex items-center justify-center text-veda-gray-400 hover:text-veda-gray-700 hover:bg-veda-gray-50 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center gap-4 mb-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-veda-gray-100 rounded-[10px]">
            {(['all', 'starred'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all',
                  tab === t
                    ? 'bg-white text-veda-gray-900 shadow-sm'
                    : 'text-veda-gray-500 hover:text-veda-gray-700'
                )}
              >
                {t === 'starred' && <Star className="w-3 h-3" />}
                {t === 'all' ? 'All Papers' : 'Starred'}
                {t === 'starred' && starred.size > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {starred.size}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-veda-gray-400" />
            <input
              type="text"
              placeholder="Search by subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-veda-gray-200 bg-white text-[13px] text-veda-gray-700 placeholder:text-veda-gray-400 focus:border-veda-orange/50 focus:ring-2 focus:ring-veda-orange/10 transition-all"
            />
          </div>

          <div className="ml-auto text-[12.5px] text-veda-gray-400 font-medium">
            {!loading && <span>{displayed.length} paper{displayed.length !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-[10px] text-red-700 text-[13px] mb-5">
            {error}{' '}
            <button onClick={load} className="font-semibold underline">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        )}

        {/* Empty state — no papers */}
        {!loading && papers.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-veda-gray-100 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-veda-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-[15px] font-bold text-veda-gray-900 mb-1">Library is empty</h3>
            <p className="text-[13px] text-veda-gray-500 mb-5 max-w-[260px]">
              Papers appear here once generated. Create your first assignment to get started.
            </p>
            <Link
              href="/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-veda-black text-white text-[13px] font-medium rounded-[10px] hover:bg-[#2A2A2A] transition-all"
            >
              Create Assignment
            </Link>
          </div>
        )}

        {/* Empty state — no starred */}
        {!loading && papers.length > 0 && tab === 'starred' && starred.size === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <Star className="w-10 h-10 text-veda-gray-200 mb-3" />
            <p className="text-[13.5px] font-semibold text-veda-gray-600 mb-1">No starred papers yet</p>
            <p className="text-[12.5px] text-veda-gray-400">Star papers to bookmark them for quick access</p>
          </div>
        )}

        {/* Grid */}
        {!loading && displayed.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {displayed.map((p) => (
              <PaperCard
                key={p._id}
                assignment={p}
                starred={starred.has(p._id)}
                onToggleStar={toggleStar}
              />
            ))}
          </div>
        )}

        {/* No search match */}
        {!loading && papers.length > 0 && displayed.length === 0 && search && (
          <div className="text-center py-16 text-veda-gray-400 text-[13.5px]">
            No papers match &quot;{search}&quot;
          </div>
        )}

      </div>
    </MainLayout>
  );
}
