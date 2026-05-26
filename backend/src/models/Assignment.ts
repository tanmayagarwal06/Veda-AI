import mongoose, { Schema, Document, Model } from 'mongoose';
import type { QuestionTypeConfig, AssignmentStatus } from '../types/index';

// ─── Interface ─────────────────────────────────────────────────────────────────

export interface IAssignment extends Document {
  subject: string;
  dueDate: Date;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  fileContent?: string;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const QuestionTypeConfigSchema = new Schema<QuestionTypeConfig>(
  {
    type: {
      type: String,
      required: true,
      enum: ['MCQ', 'Short Answer', 'Long Answer', 'Diagram/Graph-Based', 'Numerical', 'True/False'],
    },
    numberOfQuestions: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    questionTypes: {
      type: [QuestionTypeConfigSchema],
      required: true,
      validate: {
        validator: (arr: QuestionTypeConfig[]) => arr.length > 0,
        message: 'At least one question type is required',
      },
    },
    additionalInstructions: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    fileContent: {
      type: String,
      maxlength: 50000,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ──────────────────────────────────────────────────────────────────

AssignmentSchema.virtual('totalQuestions').get(function (this: IAssignment) {
  return this.questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions, 0);
});

AssignmentSchema.virtual('totalMarks').get(function (this: IAssignment) {
  return this.questionTypes.reduce(
    (sum, qt) => sum + qt.numberOfQuestions * qt.marksPerQuestion,
    0
  );
});

// ─── Indexes ───────────────────────────────────────────────────────────────────

AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ createdAt: -1 });

// ─── Model ─────────────────────────────────────────────────────────────────────

export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>(
  'Assignment',
  AssignmentSchema
);
