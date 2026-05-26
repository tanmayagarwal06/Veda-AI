import { create } from 'zustand';
import type { GeneratedPaper, Assignment } from '@/types/index';

interface PaperState {
  paper: GeneratedPaper | null;
  assignment: Assignment | null;
  loading: boolean;
  error: string | null;
  setPaper: (paper: GeneratedPaper, assignment: Assignment) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePaperStore = create<PaperState>((set) => ({
  paper: null,
  assignment: null,
  loading: false,
  error: null,

  setPaper: (paper, assignment) =>
    set({ paper, assignment, loading: false, error: null }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set({ paper: null, assignment: null, loading: false, error: null }),
}));
