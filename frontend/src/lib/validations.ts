import { z } from 'zod';

export const QuestionTypeConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['MCQ', 'Short Answer', 'Long Answer', 'Diagram/Graph-Based', 'Numerical', 'True/False'], {
    errorMap: () => ({ message: 'Select a valid question type' }),
  }),
  numberOfQuestions: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Must be a whole number')
    .min(1, 'At least 1 question required')
    .max(50, 'Max 50 questions per type'),
  marksPerQuestion: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Must be a whole number')
    .min(1, 'At least 1 mark required')
    .max(100, 'Max 100 marks per question'),
});

export const AssignmentFormSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be under 200 characters')
    .trim(),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: 'Enter a valid date' }
    ),
  questionTypes: z
    .array(QuestionTypeConfigSchema)
    .min(1, 'Add at least one question type'),
  additionalInstructions: z.string().max(2000, 'Max 2000 characters').optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
});

export type AssignmentFormValues = z.infer<typeof AssignmentFormSchema>;
