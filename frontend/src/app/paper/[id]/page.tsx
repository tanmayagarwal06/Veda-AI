'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle, Sparkles, FileSearch } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PaperOutput } from '@/components/paper/PaperOutput';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSocketStore } from '@/store/socketStore';
import { usePaperStore } from '@/store/paperStore';
import { assignmentsApi, papersApi } from '@/lib/api';

function ProcessingState({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-8">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-veda-orange-light flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-veda-orange animate-pulse-soft" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-veda-orange/20 animate-ping" />
        <div
          className="absolute w-3 h-3 rounded-full bg-veda-orange shadow-sm animate-spin-slow"
          style={{ top: '50%', left: '50%', marginTop: '-28px', marginLeft: '28px' }}
        />
      </div>
      <h2 className="text-[18px] font-bold text-veda-gray-900 mb-2">Generating Your Exam Paper</h2>
      <p className="text-[13.5px] text-veda-gray-500 text-center max-w-[300px] mb-8">
        {message || 'AI is crafting questions tailored to your specifications…'}
      </p>
      <div className="w-full max-w-[320px]">
        <div className="w-full bg-veda-gray-100 rounded-full h-2.5 overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-veda rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-veda-gray-400">
          <span>Processing</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-8">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="text-[16px] font-semibold text-veda-gray-900 mb-2">Generation Failed</h3>
      <p className="text-[13px] text-veda-gray-500 text-center max-w-[280px] mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-[10px] bg-veda-black text-white text-[13px] font-medium hover:bg-[#2A2A2A] transition-all active:scale-[0.97]"
      >
        Try Again
      </button>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-veda-gray-100 flex items-center justify-center mb-4">
        <FileSearch className="w-7 h-7 text-veda-gray-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-[16px] font-semibold text-veda-gray-900 mb-2">Paper Not Found</h3>
      <p className="text-[13px] text-veda-gray-500 max-w-[260px] mb-6">
        This assignment ID does not exist or the paper has been deleted.
      </p>
      <Link
        href="/assignments"
        className="px-5 py-2.5 rounded-[10px] bg-veda-black text-white text-[13px] font-medium hover:bg-[#2A2A2A] transition-all active:scale-[0.97]"
      >
        Back to Assignments
      </Link>
    </div>
  );
}

export default function PaperPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const paperStore = usePaperStore();
  const socketStore = useSocketStore();

  const [initialLoading, setInitialLoading] = useState(true);
  const [waitingForWs, setWaitingForWs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setErrorMsg(null);
      setNotFound(false);
      const { assignment } = await assignmentsApi.get(assignmentId);

      if (assignment.status === 'done') {
        const { paper, assignment: a } = await papersApi.getByAssignment(assignmentId);
        paperStore.setPaper(paper, a);
        setWaitingForWs(false);
      } else if (assignment.status === 'processing' || assignment.status === 'pending') {
        setWaitingForWs(true);
        socketStore.setJobStatus('processing');
      } else if (assignment.status === 'failed') {
        setErrorMsg('Paper generation failed. Please try regenerating.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load paper';
      // Detect 404 from API error message
      if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
        setNotFound(true);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setInitialLoading(false);
    }
  }, [assignmentId, paperStore, socketStore]);

  useEffect(() => {
    loadData();
    return () => {
      paperStore.reset();
      socketStore.reset();
    };
  }, [assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket — capture reconnect so handleRegenerate can force a new connection
  const { reconnect } = useWebSocket({
    assignmentId,
    onComplete: useCallback(async () => {
      try {
        const { paper, assignment } = await papersApi.getByAssignment(assignmentId);
        paperStore.setPaper(paper, assignment);
        setWaitingForWs(false);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load generated paper');
        setWaitingForWs(false);
      }
    }, [assignmentId, paperStore]),
    onFailed: useCallback((error: string) => {
      setErrorMsg(error);
      setWaitingForWs(false);
    }, []),
    onProgress: useCallback((progress: number, message: string) => {
      socketStore.setProgress(progress, message);
    }, [socketStore]),
  });

  const handleRegenerate = async () => {
    try {
      paperStore.reset();
      socketStore.reset();
      setWaitingForWs(true);
      setErrorMsg(null);
      setNotFound(false);

      await assignmentsApi.regenerate(assignmentId);

      // Force WS to reconnect and re-subscribe so we receive the new job's events
      reconnect();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to regenerate');
      setWaitingForWs(false);
    }
  };

  // Redirect to /assignments if no valid ID
  if (!assignmentId) {
    router.replace('/assignments');
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-full">
        {initialLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-veda-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[13.5px]">Loading…</span>
            </div>
          </div>
        )}
        {!initialLoading && notFound && <NotFoundState />}
        {!initialLoading && !notFound && waitingForWs && (
          <ProcessingState
            progress={socketStore.progress}
            message={socketStore.progressMessage}
          />
        )}
        {!initialLoading && !notFound && !waitingForWs && errorMsg && (
          <ErrorState message={errorMsg} onRetry={handleRegenerate} />
        )}
        {!initialLoading && !notFound && !waitingForWs && !errorMsg && paperStore.paper && paperStore.assignment && (
          <div className="pt-6 animate-fade-in">
            <PaperOutput
              paper={paperStore.paper}
              assignment={paperStore.assignment}
              onRegenerate={handleRegenerate}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
