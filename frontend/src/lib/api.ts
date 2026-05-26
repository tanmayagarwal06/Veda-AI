import axios, { type AxiosResponse } from 'axios';
import type { Assignment, GeneratedPaper, ApiResponse } from '@/types/index';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ─── Assignments API ──────────────────────────────────────────────────────────

interface CreateAssignmentPayload {
  subject: string;
  dueDate: string;
  questionTypes: Array<{
    type: string;
    numberOfQuestions: number;
    marksPerQuestion: number;
  }>;
  additionalInstructions?: string;
  fileContent?: string;
}

export const assignmentsApi = {
  list: async (): Promise<Assignment[]> => {
    const { data } = await apiClient.get<ApiResponse<{ assignments: Assignment[] }>>(
      '/api/assignments'
    );
    return data.data?.assignments ?? [];
  },

  get: async (id: string): Promise<{ assignment: Assignment; generatedPaper: GeneratedPaper | null }> => {
    const { data } = await apiClient.get<
      ApiResponse<{ assignment: Assignment; generatedPaper: GeneratedPaper | null }>
    >(`/api/assignments/${id}`);
    return data.data!;
  },

  create: async (
    payload: CreateAssignmentPayload
  ): Promise<{ assignmentId: string; status: string }> => {
    const { data } = await apiClient.post<
      ApiResponse<{ assignmentId: string; status: string }>
    >('/api/assignments', payload);
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/assignments/${id}`);
  },

  regenerate: async (id: string): Promise<{ assignmentId: string; status: string }> => {
    const { data } = await apiClient.post<
      ApiResponse<{ assignmentId: string; status: string }>
    >(`/api/assignments/${id}/regenerate`);
    return data.data!;
  },
};

// ─── Papers API ───────────────────────────────────────────────────────────────

export const papersApi = {
  getByAssignment: async (
    assignmentId: string
  ): Promise<{ paper: GeneratedPaper; assignment: Assignment }> => {
    const { data } = await apiClient.get<
      ApiResponse<{ paper: GeneratedPaper; assignment: Assignment }>
    >(`/api/paper/by-assignment/${assignmentId}`);
    return data.data!;
  },

  get: async (
    paperId: string
  ): Promise<{ paper: GeneratedPaper; assignment: Assignment }> => {
    const { data } = await apiClient.get<
      ApiResponse<{ paper: GeneratedPaper; assignment: Assignment }>
    >(`/api/paper/${paperId}`);
    return data.data!;
  },

  pdfUrl: (paperId: string): string => `${API_BASE}/api/paper/${paperId}/pdf`,
};
