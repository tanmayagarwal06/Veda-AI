import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { paperQueue } from '../config/redis';
import type { ApiResponse } from '../types/index';

const QuestionTypeConfigSchema = z.object({
  type: z.enum(['MCQ', 'Short Answer', 'Long Answer', 'Diagram/Graph-Based', 'Numerical', 'True/False']),
  numberOfQuestions: z.number().int().min(1, 'Must have at least 1 question'),
  marksPerQuestion: z.number().int().min(1, 'Marks must be at least 1'),
});

const CreateAssignmentSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long')
    .trim(),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((d) => !isNaN(Date.parse(d)), 'Invalid date format'),
  questionTypes: z
    .array(QuestionTypeConfigSchema)
    .min(1, 'At least one question type is required'),
  additionalInstructions: z.string().max(2000).optional(),
  fileContent: z.string().max(50000).optional(),
});

export async function createAssignment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = CreateAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: `Validation failed: ${parseResult.error.issues.map(i => i.message).join(', ')}`,
      } satisfies ApiResponse<never>);
      return;
    }

    const input = parseResult.data;

    const assignment = await Assignment.create({
      subject: input.subject,
      dueDate: new Date(input.dueDate),
      questionTypes: input.questionTypes,
      additionalInstructions: input.additionalInstructions,
      fileContent: input.fileContent,
      status: 'pending',
    });

    await paperQueue.add(
      'generate-paper',
      { assignmentId: assignment._id.toString() },
      { jobId: assignment._id.toString() }
    );

    console.log(`[Assignment] Created ${assignment._id}, job enqueued`);

    res.status(201).json({
      success: true,
      data: {
        assignmentId: assignment._id.toString(),
        status: assignment.status,
      },
      message: 'Assignment created and queued for processing',
    } satisfies ApiResponse<{ assignmentId: string; status: string }>);
  } catch (error) {
    next(error);
  }
}

export async function getAssignment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      res.status(404).json({
        success: false,
        error: 'Assignment not found',
      } satisfies ApiResponse<never>);
      return;
    }

    // Fetch generated paper if done
    let generatedPaper = null;
    if (assignment.status === 'done') {
      generatedPaper = await GeneratedPaper.findOne({
        assignmentId: assignment._id,
      }).lean();
    }

    res.json({
      success: true,
      data: {
        assignment,
        generatedPaper,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssignments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      Assignment.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Assignment.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAssignment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      res.status(404).json({
        success: false,
        error: 'Assignment not found',
      } satisfies ApiResponse<never>);
      return;
    }

    // Also delete associated paper
    await GeneratedPaper.deleteOne({ assignmentId: id });

    res.json({
      success: true,
      message: 'Assignment deleted',
    } satisfies ApiResponse<never>);
  } catch (error) {
    next(error);
  }
}

export async function regenerateAssignment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({
        success: false,
        error: 'Assignment not found',
      } satisfies ApiResponse<never>);
      return;
    }

    await GeneratedPaper.deleteOne({ assignmentId: id });

    assignment.status = 'pending';
    await assignment.save();

    const jobId = `regenerate-${id}-${Date.now()}`;
    await paperQueue.add('generate-paper', { assignmentId: id }, { jobId });

    res.json({
      success: true,
      data: { assignmentId: id, status: 'pending' },
      message: 'Assignment re-queued for regeneration',
    } satisfies ApiResponse<{ assignmentId: string; status: string }>);
  } catch (error) {
    next(error);
  }
}
