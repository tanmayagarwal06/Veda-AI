'use client';

import { X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuestionTypeConfig, QuestionType } from '@/types/index';

const QUESTION_TYPE_OPTIONS: QuestionType[] = [
  'MCQ',
  'Short Answer',
  'Long Answer',
  'Diagram/Graph-Based',
  'Numerical',
  'True/False',
];

interface QuestionTypeRowProps {
  config: QuestionTypeConfig;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<QuestionTypeConfig, 'id'>>) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  showRemove: boolean;
}

export function QuestionTypeRow({
  config,
  onRemove,
  onUpdate,
  onIncrement,
  onDecrement,
  showRemove,
}: QuestionTypeRowProps) {
  return (
    <div className="flex items-center gap-2 py-2.5 px-3 bg-veda-gray-50 rounded-[10px] border border-veda-gray-200 group hover:border-veda-gray-300 transition-colors">
      {/* Type dropdown */}
      <div className="flex-1 min-w-0">
        <select
          value={config.type}
          onChange={(e) => onUpdate(config.id, { type: e.target.value as QuestionType })}
          className="w-full bg-transparent text-[13px] font-medium text-veda-gray-700 border-none outline-none cursor-pointer appearance-none truncate"
        >
          {QUESTION_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Remove button */}
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(config.id)}
          className="w-5 h-5 rounded-full flex items-center justify-center text-veda-gray-400 hover:text-veda-gray-700 hover:bg-veda-gray-200 transition-all duration-150 shrink-0"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-4 bg-veda-gray-200 shrink-0" />

      {/* Count controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onDecrement(config.id)}
          className={cn(
            'w-6 h-6 rounded-[6px] flex items-center justify-center',
            'border border-veda-gray-200 bg-white text-veda-gray-500',
            'hover:border-veda-orange/50 hover:text-veda-orange hover:bg-veda-orange-light/50',
            'active:scale-95 transition-all duration-150',
            config.numberOfQuestions <= 1 && 'opacity-40 cursor-not-allowed'
          )}
          disabled={config.numberOfQuestions <= 1}
        >
          <Minus className="w-3 h-3" strokeWidth={2.5} />
        </button>

        <span className="w-7 text-center text-[13px] font-bold text-veda-orange tabular-nums">
          {config.numberOfQuestions}
        </span>

        <button
          type="button"
          onClick={() => onIncrement(config.id)}
          className={cn(
            'w-6 h-6 rounded-[6px] flex items-center justify-center',
            'border border-veda-gray-200 bg-white text-veda-gray-500',
            'hover:border-veda-orange/50 hover:text-veda-orange hover:bg-veda-orange-light/50',
            'active:scale-95 transition-all duration-150',
            config.numberOfQuestions >= 50 && 'opacity-40 cursor-not-allowed'
          )}
          disabled={config.numberOfQuestions >= 50}
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-veda-gray-200 shrink-0" />

      {/* Marks */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-veda-gray-400 font-medium">Marks</span>
        <input
          type="number"
          min={1}
          max={100}
          value={config.marksPerQuestion}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= 1 && v <= 100) {
              onUpdate(config.id, { marksPerQuestion: v });
            }
          }}
          className={cn(
            'w-10 h-7 text-center text-[13px] font-bold text-veda-orange',
            'border border-veda-gray-200 rounded-[6px] bg-white outline-none',
            'focus:border-veda-orange/50 focus:ring-2 focus:ring-veda-orange/10',
            'transition-all duration-150 tabular-nums'
          )}
        />
      </div>
    </div>
  );
}
