// ─── Domain Types ─────────────────────────────────────────────────────────────

export type AssignmentStatus = 'pending' | 'processing' | 'done' | 'failed';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType =
  | 'MCQ'
  | 'Short Answer'
  | 'Long Answer'
  | 'Diagram/Graph-Based'
  | 'Numerical'
  | 'True/False';

// ─── Request / Response Shapes ────────────────────────────────────────────────

export interface QuestionTypeConfig {
  type: QuestionType;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface CreateAssignmentInput {
  subject: string;
  dueDate: string; // ISO date string
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  fileContent?: string; // extracted text from uploaded file
}

// ─── AI / Generated Paper Types ──────────────────────────────────────────────

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

export interface GeneratedPaperData {
  sections: PaperSection[];
}

// ─── WebSocket Message Types ───────────────────────────────────────────────────

export interface WSSubscribeMessage {
  type: 'subscribe';
  assignmentId: string;
}

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

export type WSOutboundMessage =
  | WSJobProgressMessage
  | WSJobCompleteMessage
  | WSJobFailedMessage;

// ─── BullMQ Job Data ───────────────────────────────────────────────────────────

export interface PaperGenerationJobData {
  assignmentId: string;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
