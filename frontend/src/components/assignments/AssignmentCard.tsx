'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Eye, Trash2, RefreshCw } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { Assignment } from '@/types/index';

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
}

const STATUS_DOT = {
  pending: 'bg-veda-gray-300',
  processing: 'bg-veda-orange animate-pulse-soft',
  done: 'bg-difficulty-easy',
  failed: 'bg-difficulty-hard',
};

export function AssignmentCard({ assignment, onDelete, onRegenerate }: AssignmentCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleView = () => {
    if (assignment.status === 'done') {
      router.push(`/paper/${assignment._id}`);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-[12px] border border-veda-gray-200 p-4',
        'hover:border-veda-gray-300 hover:shadow-card-hover transition-all duration-200 cursor-pointer group',
        assignment.status === 'done' && 'cursor-pointer'
      )}
      onClick={handleView}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-veda-gray-900 font-semibold text-[14px] leading-snug line-clamp-2 flex-1 pr-2">
          {assignment.subject}
        </h3>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            className={cn(
              'w-7 h-7 rounded-[6px] flex items-center justify-center',
              'text-veda-gray-400 hover:text-veda-gray-700 hover:bg-veda-gray-100',
              'transition-all duration-150 opacity-0 group-hover:opacity-100',
              menuOpen && 'opacity-100 bg-veda-gray-100 text-veda-gray-700'
            )}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            <MoreVertical className="w-4 h-4" strokeWidth={2} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-[148px] bg-white rounded-[10px] shadow-float border border-veda-gray-200 py-1 animate-fade-in">
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-medium text-veda-gray-700 hover:bg-veda-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  handleView();
                }}
              >
                <Eye className="w-3.5 h-3.5 text-veda-gray-500" />
                View Assignment
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-medium text-veda-gray-700 hover:bg-veda-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRegenerate(assignment._id);
                }}
              >
                <RefreshCw className="w-3.5 h-3.5 text-veda-gray-500" />
                Regenerate
              </button>
              <div className="h-px bg-veda-gray-100 my-1" />
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(assignment._id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {assignment.status !== 'done' && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[assignment.status])} />
          <span className="text-[11px] font-medium text-veda-gray-400 capitalize">
            {assignment.status === 'processing' ? 'Generating…' : assignment.status}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-veda-gray-100">
        <span className="text-[11px] text-veda-gray-400">
          Assigned on{' '}
          <span className="text-veda-gray-600 font-medium">
            {formatDate(assignment.createdAt)}
          </span>
        </span>
        <span className="text-[11px] text-veda-gray-400">
          Due{' '}
          <span className="text-veda-gray-600 font-medium">
            {formatDate(assignment.dueDate)}
          </span>
        </span>
      </div>
    </div>
  );
}
