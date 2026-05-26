'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { AssignmentCard } from '@/components/assignments/AssignmentCard';
import { EmptyState } from '@/components/assignments/EmptyState';
import { assignmentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/types/index';

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[12px] border border-veda-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-veda-gray-200 rounded-full w-3/4 mb-3" />
      <div className="h-3 bg-veda-gray-100 rounded-full w-1/2 mb-4" />
      <div className="flex justify-between pt-2 border-t border-veda-gray-100">
        <div className="h-3 bg-veda-gray-100 rounded-full w-1/3" />
        <div className="h-3 bg-veda-gray-100 rounded-full w-1/4" />
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      setError(null);
      const data = await assignmentsApi.list();
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await assignmentsApi.delete(id);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      await assignmentsApi.regenerate(id);
      // Navigate to paper page to watch regeneration
      router.push(`/paper/${id}?regenerating=true`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to regenerate');
    }
  };

  const filtered = assignments.filter((a) =>
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 max-w-[1100px] mx-auto">
        {/* ── Page Header ── */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-veda-gray-900 tracking-tight mb-1">
            Assignments
          </h1>
          <p className="text-[13.5px] text-veda-gray-500">
            Manage and create assignments for your students
          </p>
        </div>

        {/* ── Toolbar ── */}
        {!loading && assignments.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            {/* Filter button */}
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] border border-veda-gray-200 bg-white text-[12.5px] font-medium text-veda-gray-600 hover:border-veda-gray-300 hover:bg-veda-gray-50 transition-all duration-150">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter By
            </button>

            {/* Search */}
            <div className="flex-1 relative max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-veda-gray-400" />
              <input
                type="text"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-2 rounded-[8px] border border-veda-gray-200 bg-white',
                  'text-[13px] text-veda-gray-700 placeholder:text-veda-gray-400',
                  'focus:border-veda-orange/50 focus:ring-2 focus:ring-veda-orange/10',
                  'transition-all duration-150'
                )}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadAssignments}
              className="w-8 h-8 rounded-[8px] border border-veda-gray-200 bg-white flex items-center justify-center text-veda-gray-400 hover:text-veda-gray-700 hover:bg-veda-gray-50 transition-all duration-150"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Create button (right) */}
            <div className="ml-auto">
              <Link
                href="/create"
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-veda-black text-white text-[12.5px] font-medium hover:bg-[#2A2A2A] transition-all duration-150 active:scale-[0.97]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Create Assignment
              </Link>
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-[10px] text-red-700 text-[13px] mb-5">
            {error}{' '}
            <button onClick={loadAssignments} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && assignments.length === 0 && !error && (
          <div className="flex items-center justify-center min-h-[400px]">
            <EmptyState />
          </div>
        )}

        {/* ── Assignments grid ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filtered.map((assignment) => (
              <div
                key={assignment._id}
                className={cn(
                  'transition-opacity duration-200',
                  deletingId === assignment._id && 'opacity-50 pointer-events-none'
                )}
              >
                <AssignmentCard
                  assignment={assignment}
                  onDelete={handleDelete}
                  onRegenerate={handleRegenerate}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── No search results ── */}
        {!loading && assignments.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-veda-gray-400 text-[13.5px]">
            No assignments match &quot;{search}&quot;
          </div>
        )}

        {/* ── Bottom FAB for create (mobile) ── */}
        <Link
          href="/create"
          className="fixed bottom-6 right-6 md:hidden w-12 h-12 bg-veda-black rounded-full flex items-center justify-center shadow-float hover:bg-[#2A2A2A] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        </Link>
      </div>
    </MainLayout>
  );
}
