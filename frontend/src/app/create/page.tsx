'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight, Calendar, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileUpload } from '@/components/create/FileUpload';
import { QuestionTypeRow } from '@/components/create/QuestionTypeRow';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useSocketStore } from '@/store/socketStore';
import { assignmentsApi } from '@/lib/api';
import { AssignmentFormSchema } from '@/lib/validations';
import { cn } from '@/lib/utils';

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            i < current
              ? 'bg-veda-orange w-6'
              : i === current - 1
              ? 'bg-veda-orange w-8'
              : 'bg-veda-gray-200 w-6'
          )}
        />
      ))}
    </div>
  );
}

function GeneratingOverlay({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-[20px] p-8 max-w-[360px] w-full mx-4 shadow-float animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-veda-orange-light flex items-center justify-center relative">
            <Sparkles className="w-7 h-7 text-veda-orange animate-pulse-soft" />
            <div className="absolute inset-0 rounded-full border-2 border-veda-orange/30 animate-ping" />
          </div>
        </div>
        <h3 className="text-[16px] font-bold text-veda-gray-900 text-center mb-1">
          Generating Your Paper
        </h3>
        <p className="text-[13px] text-veda-gray-500 text-center mb-6">
          {message || 'Connecting to AI…'}
        </p>
        <div className="w-full bg-veda-gray-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-veda rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
        <p className="text-[12px] text-veda-gray-400 text-right tabular-nums">{progress}%</p>
      </div>
    </div>
  );
}

function WsListener({
  assignmentId,
  onComplete,
  onFailed,
}: {
  assignmentId: string;
  onComplete: (paperId: string) => void;
  onFailed: (error: string) => void;
}) {
  const setProgress = useSocketStore((s) => s.setProgress);

  useWebSocket({
    assignmentId,
    onComplete,
    onFailed,
    onProgress: setProgress,
  });

  return null;
}

export default function CreatePage() {
  const router = useRouter();
  const store = useAssignmentStore();

  const progress = useSocketStore((s) => s.progress);
  const progressMessage = useSocketStore((s) => s.progressMessage);

  const [submitting, setSubmitting] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Stable callbacks for WsListener (useCallback so they don't re-create WsListener)
  const handleWsComplete = useCallback(
    (_paperId: string) => {
      router.push(`/paper/${assignmentId}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignmentId, router]
  );

  const handleWsFailed = useCallback((error: string) => {
    setSubmitting(false);
    alert(`Generation failed: ${error}`);
  }, []);

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!store.subject.trim()) errs.subject = 'Subject is required';
    if (!store.dueDate) errs.dueDate = 'Due date is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    // Validate using store data which still includes `id` (required by the schema).
    // The schema's QuestionTypeConfigSchema has `id: z.string()` — we keep it here
    // for validation then strip it out in the actual API payload below.
    const storePayload = {
      subject: store.subject,
      dueDate: store.dueDate,
      questionTypes: store.questionTypes, // keep `id` so schema validates correctly
      additionalInstructions: store.additionalInstructions || undefined,
      fileContent: store.fileContent || undefined,
      fileName: store.fileName || undefined,
    };

    const result = AssignmentFormSchema.safeParse(storePayload);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        // Normalise path: "questionTypes.0.type" → "questionTypes" so the
        // existing error banner under the question list picks it up.
        const rawKey = issue.path.join('.');
        const key = rawKey.startsWith('questionTypes') ? 'questionTypes' : rawKey;
        errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      // Strip client-only `id` field before sending to the backend
      const { assignmentId: id } = await assignmentsApi.create({
        subject: store.subject,
        dueDate: store.dueDate,
        questionTypes: store.questionTypes.map(({ id: _id, ...rest }) => rest),
        additionalInstructions: store.additionalInstructions || undefined,
        fileContent: store.fileContent || undefined,
      });

      setAssignmentId(id);
    } catch (err) {
      setSubmitting(false);
      alert(err instanceof Error ? err.message : 'Failed to create assignment');
    }
  };

  const handleNext = () => {
    if (store.currentStep === 1 && validateStep1()) store.setStep(2);
  };

  const handlePrev = () => {
    if (store.currentStep === 2) store.setStep(1);
  };

  const totalQ = store.totalQuestions();
  const totalM = store.totalMarks();

  return (
    <MainLayout>
      {assignmentId && (
        <WsListener
          assignmentId={assignmentId}
          onComplete={handleWsComplete}
          onFailed={handleWsFailed}
        />
      )}
      {submitting && assignmentId && (
        <GeneratingOverlay progress={progress} message={progressMessage} />
      )}

      <div className="max-w-[680px] mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[20px] font-bold text-veda-gray-900 tracking-tight">
                Create Assignment
              </h1>
              <p className="text-[13px] text-veda-gray-500 mt-0.5">
                Set it to help design assignments for your students
              </p>
            </div>
            <StepIndicator current={store.currentStep} total={2} />
          </div>
          <div className="h-px bg-veda-gray-200" />
        </div>
        {store.currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-[15px] font-bold text-veda-gray-900 mb-0.5">
                Assignment Details
              </h2>
              <p className="text-[12.5px] text-veda-gray-500">
                Basic information about your assignment
              </p>
            </div>

            <FileUpload
              fileName={store.fileName}
              onFile={store.setFileContent}
              onClear={store.clearFile}
            />
            <div>
              <label className="block text-[12.5px] font-semibold text-veda-gray-700 mb-1.5">
                Subject <span className="text-veda-orange">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Grade 8 Science — NCERT Chapter 14"
                value={store.subject}
                onChange={(e) => {
                  store.setSubject(e.target.value);
                  setFieldErrors((p) => ({ ...p, subject: '' }));
                }}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-[10px] border bg-white text-[13.5px]',
                  'text-veda-gray-800 placeholder:text-veda-gray-400',
                  'focus:border-veda-orange/60 focus:ring-2 focus:ring-veda-orange/10 transition-all duration-150',
                  fieldErrors.subject ? 'border-red-300 ring-2 ring-red-100' : 'border-veda-gray-200'
                )}
              />
              {fieldErrors.subject && (
                <p className="mt-1 text-[11.5px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.subject}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-veda-gray-700 mb-1.5">
                Due Date <span className="text-veda-orange">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={store.dueDate}
                  onChange={(e) => {
                    store.setDueDate(e.target.value);
                    setFieldErrors((p) => ({ ...p, dueDate: '' }));
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={cn(
                    'w-full px-3.5 py-2.5 pr-10 rounded-[10px] border bg-white text-[13.5px]',
                    'text-veda-gray-800 focus:border-veda-orange/60 focus:ring-2 focus:ring-veda-orange/10 transition-all duration-150',
                    fieldErrors.dueDate ? 'border-red-300 ring-2 ring-red-100' : 'border-veda-gray-200'
                  )}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veda-gray-400 pointer-events-none" />
              </div>
              {fieldErrors.dueDate && (
                <p className="mt-1 text-[11.5px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.dueDate}
                </p>
              )}
            </div>
          </div>
        )}
        {store.currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-[15px] font-bold text-veda-gray-900 mb-0.5">
                Question Configuration
              </h2>
              <p className="text-[12.5px] text-veda-gray-500">
                Define question types, counts, and marks
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12.5px] font-semibold text-veda-gray-700">
                  Question Type
                </label>
                <div className="flex items-center gap-2 text-[11.5px] text-veda-gray-400">
                  <span>No. of Questions</span>
                  <span>·</span>
                  <span>Marks</span>
                </div>
              </div>

              <div className="space-y-2">
                {store.questionTypes.map((qt) => (
                  <QuestionTypeRow
                    key={qt.id}
                    config={qt}
                    showRemove={store.questionTypes.length > 1}
                    onRemove={store.removeQuestionType}
                    onUpdate={store.updateQuestionType}
                    onIncrement={store.incrementCount}
                    onDecrement={store.decrementCount}
                  />
                ))}
              </div>

              {fieldErrors.questionTypes && (
                <p className="mt-1.5 text-[11.5px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.questionTypes}
                </p>
              )}

              <button
                type="button"
                onClick={store.addQuestionType}
                className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium text-veda-orange hover:text-veda-orange-hover transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Add Question Type
              </button>
            </div>
            <div className="flex items-center justify-end gap-6 py-3 px-4 bg-veda-gray-50 rounded-[10px] border border-veda-gray-200">
              <div className="text-right">
                <span className="text-[11px] text-veda-gray-400 block font-medium uppercase tracking-wide">Total Questions</span>
                <span className="text-[15px] font-bold text-veda-gray-900 tabular-nums">{totalQ}</span>
              </div>
              <div className="w-px h-8 bg-veda-gray-200" />
              <div className="text-right">
                <span className="text-[11px] text-veda-gray-400 block font-medium uppercase tracking-wide">Total Marks</span>
                <span className="text-[15px] font-bold text-veda-orange tabular-nums">{totalM}</span>
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-veda-gray-700 mb-1.5">
                Additional Information{' '}
                <span className="font-normal text-veda-gray-400">(for better output)</span>
              </label>
              <textarea
                placeholder="e.g. Generate a question paper for 3-hour exam, focus on NCERT chapters 10–14…"
                value={store.additionalInstructions}
                onChange={(e) => store.setAdditionalInstructions(e.target.value)}
                rows={3}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-[10px] border border-veda-gray-200 bg-white',
                  'text-[13.5px] text-veda-gray-800 placeholder:text-veda-gray-400',
                  'focus:border-veda-orange/60 focus:ring-2 focus:ring-veda-orange/10 transition-all duration-150 resize-none'
                )}
                maxLength={2000}
              />
              <p className="mt-1 text-[11px] text-veda-gray-400 text-right">
                {store.additionalInstructions.length}/2000
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-veda-gray-200">
          <button
            type="button"
            onClick={handlePrev}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-medium',
              'border border-veda-gray-200 text-veda-gray-600 bg-white',
              'hover:border-veda-gray-300 hover:bg-veda-gray-50 transition-all duration-150 active:scale-[0.97]',
              store.currentStep === 1 && 'invisible'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {store.currentStep === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-medium bg-veda-black text-white hover:bg-[#2A2A2A] transition-all duration-150 active:scale-[0.97] shadow-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-medium',
                'bg-gradient-veda text-white shadow-sm',
                'hover:opacity-90 transition-all duration-150 active:scale-[0.97]',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
              )}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate Paper</>
              )}
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
