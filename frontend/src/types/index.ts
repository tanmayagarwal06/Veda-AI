// ─── Domain Types ──────────────────────────────────────────────────────────────

export type AssignmentStatus = 'pending' | 'processing' | 'done' | 'failed';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType =
  | 'MCQ'
  | 'Short Answer'
  | 'Long Answer'
  | 'Diagram/Graph-Based'
  | 'Numerical'
  | 'True/False';

// ─── Form / Store Types ────────────────────────────────────────────────────────

export interface QuestionTypeConfig {
  id: string; // client-side unique ID for list key
  type: QuestionType;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  subject: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  fileContent?: string;
  fileName?: string;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface Assignment {
  _id: string;
  subject: string;
  dueDate: string;
  questionTypes: Omit<QuestionTypeConfig, 'id'>[];
  additionalInstructions?: string;
  fileContent?: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  totalQuestions?: number;
  totalMarks?: number;
}

export interface GeneratedQuestion {
  text: string;
  difficulty: QuestionDifficulty;
  marks: number;
  type: QuestionType;
}

export interface PaperSection {
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  sections: PaperSection[];
  generatedAt: string;
  createdAt: string;
  totalQuestions?: number;
  totalMarks?: number;
}

// ─── WebSocket Message Types ───────────────────────────────────────────────────

export interface WSJobProgressMessage {
  type: 'job:progress';
  assignmentId: string;
  progress: number;
  message: string;
}

export interface WSJobCompleteMessage {
  type: 'job:complete';
  assignmentId: string;
  paperId: string;
}

export interface WSJobFailedMessage {
  type: 'job:failed';
  assignmentId: string;
  error: string;
}

export type WSMessage =
  | WSJobProgressMessage
  | WSJobCompleteMessage
  | WSJobFailedMessage
  | { type: 'subscribed'; assignmentId: string };

// ─── Zod schema base types (for inference) ────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
