import { create } from 'zustand';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type JobStatus = 'idle' | 'queued' | 'processing' | 'done' | 'failed';

interface SocketState {
  ws: WebSocket | null;
  connectionStatus: ConnectionStatus;
  jobStatus: JobStatus;
  progress: number;
  progressMessage: string;
  assignmentId: string | null;
  paperId: string | null;
  errorMessage: string | null;

  setWs: (ws: WebSocket | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setJobStatus: (status: JobStatus) => void;
  setProgress: (progress: number, message: string) => void;
  setComplete: (paperId: string) => void;
  setFailed: (error: string) => void;
  setAssignmentId: (id: string) => void;
  disconnect: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  ws: null,
  connectionStatus: 'disconnected',
  jobStatus: 'idle',
  progress: 0,
  progressMessage: '',
  assignmentId: null,
  paperId: null,
  errorMessage: null,

  setWs: (ws) => set({ ws }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setJobStatus: (jobStatus) => set({ jobStatus }),

  setProgress: (progress, message) =>
    set({ progress, progressMessage: message, jobStatus: 'processing' }),

  setComplete: (paperId) =>
    set({ paperId, jobStatus: 'done', progress: 100, progressMessage: 'Paper generated!' }),

  setFailed: (error) =>
    set({ errorMessage: error, jobStatus: 'failed', progressMessage: '' }),

  setAssignmentId: (id) => set({ assignmentId: id }),

  disconnect: () => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    set({ ws: null, connectionStatus: 'disconnected' });
  },

  reset: () =>
    set({
      ws: null,
      connectionStatus: 'disconnected',
      jobStatus: 'idle',
      progress: 0,
      progressMessage: '',
      assignmentId: null,
      paperId: null,
      errorMessage: null,
    }),
}));
