'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-8 animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 bg-veda-orange-light rounded-full blur-3xl opacity-50 scale-150" />

        {/* Document illustration */}
        <div className="relative w-[120px] h-[140px]">
          {/* Main document */}
          <div className="absolute inset-x-0 bottom-0 w-[100px] h-[120px] mx-auto bg-white rounded-xl border-2 border-veda-gray-200 shadow-card">
            {/* Lines */}
            <div className="pt-10 px-4 space-y-2">
              <div className="h-2 bg-veda-gray-200 rounded-full w-full" />
              <div className="h-2 bg-veda-gray-200 rounded-full w-3/4" />
              <div className="h-2 bg-veda-gray-200 rounded-full w-5/6" />
            </div>
          </div>

          {/* Red X overlay */}
          <div className="absolute top-0 right-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Floating sparkle decorators */}
          <svg
            className="absolute -top-2 -left-2 w-5 h-5 text-veda-orange/40"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 0l1.5 5.5L17 7l-5.5 1.5L10 14l-1.5-5.5L3 7l5.5-1.5L10 0z" />
          </svg>
          <svg
            className="absolute bottom-2 -right-3 w-4 h-4 text-veda-orange/30"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 0l1.5 5.5L17 7l-5.5 1.5L10 14l-1.5-5.5L3 7l5.5-1.5L10 0z" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <h3 className="text-veda-gray-900 font-semibold text-[17px] mb-2 text-center">
        No assignments yet
      </h3>
      <p className="text-veda-gray-500 text-[13.5px] text-center max-w-[320px] leading-relaxed mb-8">
        Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>

      {/* CTA Button */}
      <Link
        href="/create"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-veda-black text-white text-[13px] font-medium rounded-[10px] hover:bg-[#2A2A2A] transition-all duration-150 active:scale-[0.98] shadow-sm"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Create Your First Assignment
      </Link>
    </div>
  );
}
