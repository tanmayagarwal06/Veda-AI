'use client';

import { useRef, useState } from 'react';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { cn, DIFFICULTY_CONFIG, formatDateLong, getSectionLetter } from '@/lib/utils';
import { papersApi } from '@/lib/api';
import type { GeneratedPaper, Assignment, PaperSection, GeneratedQuestion } from '@/types/index';

interface PaperOutputProps {
  paper: GeneratedPaper;
  assignment: Assignment;
  onRegenerate: () => void;
}

function DifficultyBadge({ difficulty }: { difficulty: GeneratedQuestion['difficulty'] }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] text-[10.5px] font-semibold shrink-0',
        cfg.color,
        cfg.bg,
        'border',
        cfg.border
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function QuestionItem({ question, number }: { question: GeneratedQuestion; number: number }) {
  return (
    <div className="py-3 border-b border-veda-gray-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="text-[13px] font-bold text-veda-gray-900 shrink-0 w-6 mt-0.5 tabular-nums">
          {number}.
        </span>
        <p className="flex-1 text-[13px] text-veda-gray-800 leading-relaxed">
          {question.text}
        </p>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="text-[11px] font-medium text-veda-gray-400 whitespace-nowrap">
            [{question.marks} mark{question.marks > 1 ? 's' : ''}]
          </span>
        </div>
      </div>
      {question.options && question.options.length > 0 && (
        <div className="ml-9 mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[12.5px] text-veda-gray-700">
              <span className="font-semibold shrink-0 text-veda-gray-500">{OPTION_LABELS[i]}.</span>
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  index,
  questionOffset,
}: {
  section: PaperSection;
  index: number;
  questionOffset: number;
}) {
  const letter = getSectionLetter(index);
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-3">
        <div className="flex-1 h-px bg-veda-gray-200" />
        <div className="mx-4 px-5 py-1.5 border border-veda-gray-300 rounded-[6px] bg-white">
          <span className="text-[12px] font-bold text-veda-gray-700 tracking-wide uppercase">
            Section {letter}
          </span>
        </div>
        <div className="flex-1 h-px bg-veda-gray-200" />
      </div>
      <div className="mb-4 text-center">
        <h4 className="text-[14px] font-bold text-veda-gray-900 mb-1">{section.title}</h4>
        <p className="text-[12px] text-veda-gray-500 italic">{section.instruction}</p>
      </div>
      <div className="bg-white rounded-[12px] border border-veda-gray-200 px-4">
        {section.questions.map((q, qi) => (
          <QuestionItem key={qi} question={q} number={questionOffset + qi + 1} />
        ))}
      </div>
    </div>
  );
}

export function PaperOutput({ paper, assignment, onRegenerate }: PaperOutputProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const totalMarks = paper.sections.reduce(
    (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.marks, 0),
    0
  );
  const totalQuestions = paper.sections.reduce((sum, s) => sum + s.questions.length, 0);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(papersApi.pdfUrl(paper._id), {
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.subject.replace(/[^a-z0-9]/gi, '-')}-exam.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setDownloadError(`PDF generation failed — ${msg}. Try using the browser print dialog instead.`);
    } finally {
      setDownloading(false);
    }
  };

  let runningOffset = 0;

  return (
    <div className="max-w-[820px] mx-auto px-6 pb-12">
      {downloadError && (
        <div className="no-print mb-4 p-3 bg-red-50 border border-red-200 rounded-[10px] flex items-start justify-between gap-3">
          <p className="text-[12.5px] text-red-700 leading-relaxed flex-1">{downloadError}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="text-[12px] font-medium text-red-600 underline underline-offset-2 hover:text-red-800"
            >
              Use print dialog
            </button>
            <button
              onClick={() => setDownloadError(null)}
              className="text-[11px] text-red-400 hover:text-red-600 font-medium"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="no-print mb-6 p-4 bg-veda-orange-light border border-veda-orange/20 rounded-[12px] flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-veda flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-[11px] font-bold">AI</span>
        </div>
        <div className="flex-1">
          <p className="text-[13px] text-veda-gray-700 leading-relaxed">
            Here is your customised exam paper for{' '}
            <strong>{assignment.subject}</strong>. It contains{' '}
            {totalQuestions} questions worth{' '}
            {totalMarks} marks total, organised into{' '}
            {paper.sections.length} section{paper.sections.length > 1 ? 's' : ''}.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12.5px] font-medium shrink-0',
            'bg-white border border-veda-gray-200 text-veda-gray-700',
            'hover:border-veda-orange/50 hover:text-veda-orange hover:bg-veda-orange-light/50',
            'transition-all duration-150 active:scale-[0.97] shadow-sm',
            downloading && 'opacity-60 cursor-not-allowed'
          )}
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>
      <div ref={paperRef} className="bg-white rounded-[16px] border border-veda-gray-200 shadow-card overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center border-b border-veda-gray-200">
          <h1 className="text-[20px] font-bold text-veda-gray-900 mb-1 font-serif">
            Delhi Public School, Sector-4, Bokaro
          </h1>
          <p className="text-[14px] font-semibold text-veda-gray-700 mb-0.5">
            Subject: {assignment.subject}
          </p>
          <p className="text-[13px] text-veda-gray-500">Class: 8th</p>
        </div>
        <div className="px-8 py-4 flex items-center justify-between border-b border-veda-gray-100 bg-veda-gray-50/50">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-veda-gray-400 font-medium uppercase tracking-wide">Time Allowed</span>
              <p className="text-[13px] font-semibold text-veda-gray-800 mt-0.5">
                {Math.ceil(totalQuestions * 2.5)} minutes
              </p>
            </div>
            <div className="w-px h-8 bg-veda-gray-200" />
            <div>
              <span className="text-[11px] text-veda-gray-400 font-medium uppercase tracking-wide">Maximum Marks</span>
              <p className="text-[13px] font-semibold text-veda-gray-800 mt-0.5">{totalMarks}</p>
            </div>
            <div className="w-px h-8 bg-veda-gray-200" />
            <div>
              <span className="text-[11px] text-veda-gray-400 font-medium uppercase tracking-wide">Total Questions</span>
              <p className="text-[13px] font-semibold text-veda-gray-800 mt-0.5">{totalQuestions}</p>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-veda-gray-400 font-medium uppercase tracking-wide">Due Date</span>
            <p className="text-[13px] font-semibold text-veda-gray-800 mt-0.5">
              {formatDateLong(assignment.dueDate)}
            </p>
          </div>
        </div>
        <div className="px-8 py-3 bg-veda-gray-50/30 border-b border-veda-gray-100">
          <p className="text-[12px] italic text-veda-gray-500">
            All questions are compulsory unless stated otherwise.
          </p>
        </div>
        <div className="px-8 py-5 border-b border-veda-gray-200">
          <div className="flex items-end gap-8">
            <div className="flex-1">
              <label className="text-[12px] font-medium text-veda-gray-600 block mb-1">Name:</label>
              <input
                type="text"
                placeholder="Student name"
                className={cn(
                  'w-full border-b border-veda-gray-400 py-1 text-[13px] text-veda-gray-800 bg-transparent',
                  'outline-none placeholder:text-veda-gray-300',
                  'focus:border-veda-orange transition-colors duration-150'
                )}
              />
            </div>
            <div className="w-36">
              <label className="text-[12px] font-medium text-veda-gray-600 block mb-1">Roll Number:</label>
              <input
                type="text"
                placeholder="Roll no."
                className={cn(
                  'w-full border-b border-veda-gray-400 py-1 text-[13px] text-veda-gray-800 bg-transparent',
                  'outline-none placeholder:text-veda-gray-300',
                  'focus:border-veda-orange transition-colors duration-150'
                )}
              />
            </div>
            <div className="w-44">
              <label className="text-[12px] font-medium text-veda-gray-600 block mb-1">Class / Section:</label>
              <input
                type="text"
                placeholder="e.g. 10-A"
                className={cn(
                  'w-full border-b border-veda-gray-400 py-1 text-[13px] text-veda-gray-800 bg-transparent',
                  'outline-none placeholder:text-veda-gray-300',
                  'focus:border-veda-orange transition-colors duration-150'
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-8 pt-6">
          {paper.sections.map((section, i) => {
            const offset = runningOffset;
            runningOffset += section.questions.length;
            return (
              <SectionBlock key={i} section={section} index={i} questionOffset={offset} />
            );
          })}
        </div>
        <div className="px-8 py-5 border-t border-veda-gray-200 text-center">
          <p className="text-[11px] text-veda-gray-400 italic">— End of Question Paper —</p>
        </div>
      </div>
      <div className="no-print flex items-center justify-between mt-6">
        <button
          onClick={onRegenerate}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-medium',
            'border border-veda-gray-200 text-veda-gray-600 bg-white',
            'hover:border-veda-gray-300 hover:bg-veda-gray-50',
            'transition-all duration-150 active:scale-[0.97]'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate Paper
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-medium',
            'bg-veda-black text-white',
            'hover:bg-[#2A2A2A] transition-all duration-150 active:scale-[0.97] shadow-sm',
            downloading && 'opacity-60 cursor-not-allowed'
          )}
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
}
