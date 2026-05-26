import { create } from 'zustand';
import { nanoid } from '@/lib/utils';
import type { QuestionTypeConfig, QuestionType } from '@/types/index';

interface AssignmentFormState {
  // Step management
  currentStep: 1 | 2;
  setStep: (step: 1 | 2) => void;

  // Form fields
  subject: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  fileContent: string | undefined;
  fileName: string | undefined;

  // Validation errors
  errors: Partial<Record<string, string>>;

  // Actions
  setSubject: (v: string) => void;
  setDueDate: (v: string) => void;
  setAdditionalInstructions: (v: string) => void;
  setFileContent: (content: string, name: string) => void;
  clearFile: () => void;

  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, patch: Partial<Omit<QuestionTypeConfig, 'id'>>) => void;
  incrementCount: (id: string) => void;
  decrementCount: (id: string) => void;

  setErrors: (errors: Partial<Record<string, string>>) => void;
  clearErrors: () => void;
  resetForm: () => void;

  // Derived
  totalQuestions: () => number;
  totalMarks: () => number;
}

const DEFAULT_QUESTION_TYPES: QuestionTypeConfig[] = [
  { id: nanoid(), type: 'MCQ', numberOfQuestions: 5, marksPerQuestion: 1 },
];

export const useAssignmentStore = create<AssignmentFormState>((set, get) => ({
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),

  subject: '',
  dueDate: '',
  questionTypes: DEFAULT_QUESTION_TYPES,
  additionalInstructions: '',
  fileContent: undefined,
  fileName: undefined,
  errors: {},

  setSubject: (v) => set({ subject: v }),
  setDueDate: (v) => set({ dueDate: v }),
  setAdditionalInstructions: (v) => set({ additionalInstructions: v }),

  setFileContent: (content, name) => set({ fileContent: content, fileName: name }),
  clearFile: () => set({ fileContent: undefined, fileName: undefined }),

  addQuestionType: () =>
    set((state) => ({
      questionTypes: [
        ...state.questionTypes,
        {
          id: nanoid(),
          type: 'Short Answer' as QuestionType,
          numberOfQuestions: 3,
          marksPerQuestion: 2,
        },
      ],
    })),

  removeQuestionType: (id) =>
    set((state) => ({
      questionTypes: state.questionTypes.filter((qt) => qt.id !== id),
    })),

  updateQuestionType: (id, patch) =>
    set((state) => ({
      questionTypes: state.questionTypes.map((qt) =>
        qt.id === id ? { ...qt, ...patch } : qt
      ),
    })),

  incrementCount: (id) =>
    set((state) => ({
      questionTypes: state.questionTypes.map((qt) =>
        qt.id === id
          ? { ...qt, numberOfQuestions: Math.min(qt.numberOfQuestions + 1, 50) }
          : qt
      ),
    })),

  decrementCount: (id) =>
    set((state) => ({
      questionTypes: state.questionTypes.map((qt) =>
        qt.id === id
          ? { ...qt, numberOfQuestions: Math.max(qt.numberOfQuestions - 1, 1) }
          : qt
      ),
    })),

  setErrors: (errors) => set({ errors }),
  clearErrors: () => set({ errors: {} }),

  resetForm: () =>
    set({
      currentStep: 1,
      subject: '',
      dueDate: '',
      questionTypes: DEFAULT_QUESTION_TYPES.map((qt) => ({ ...qt, id: nanoid() })),
      additionalInstructions: '',
      fileContent: undefined,
      fileName: undefined,
      errors: {},
    }),

  totalQuestions: () =>
    get().questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions, 0),

  totalMarks: () =>
    get().questionTypes.reduce(
      (sum, qt) => sum + qt.numberOfQuestions * qt.marksPerQuestion,
      0
    ),
}));
