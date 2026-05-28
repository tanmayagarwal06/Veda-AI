import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { PaperSection, GeneratedQuestion, QuestionDifficulty, QuestionType } from '../types/index';

export interface IGeneratedPaper extends Document {
  assignmentId: Types.ObjectId;
  sections: PaperSection[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<GeneratedQuestion>(
  {
    text: { type: String, required: true },
    options: { type: [String], default: undefined },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
    } as { type: StringConstructor; required: true; enum: QuestionDifficulty[] },
    marks: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      required: true,
      enum: ['MCQ', 'Short Answer', 'Long Answer', 'Diagram/Graph-Based', 'Numerical', 'True/False'],
    } as { type: StringConstructor; required: true; enum: QuestionType[] },
  },
  { _id: false }
);

const SectionSchema = new Schema<PaperSection>(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: {
      type: [QuestionSchema],
      required: true,
      validate: {
        validator: (arr: GeneratedQuestion[]) => arr.length > 0,
        message: 'A section must have at least one question',
      },
    },
  },
  { _id: false }
);

const GeneratedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    sections: {
      type: [SectionSchema],
      required: true,
      validate: {
        validator: (arr: PaperSection[]) => arr.length > 0,
        message: 'Paper must have at least one section',
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GeneratedPaperSchema.virtual('totalQuestions').get(function (this: IGeneratedPaper) {
  return this.sections.reduce((sum, s) => sum + s.questions.length, 0);
});

GeneratedPaperSchema.virtual('totalMarks').get(function (this: IGeneratedPaper) {
  return this.sections.reduce(
    (sum, s) => sum + s.questions.reduce((qsum, q) => qsum + q.marks, 0),
    0
  );
});

export const GeneratedPaper: Model<IGeneratedPaper> = mongoose.model<IGeneratedPaper>(
  'GeneratedPaper',
  GeneratedPaperSchema
);
