import { Request, Response, NextFunction } from 'express';
import puppeteer from 'puppeteer';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { Assignment } from '../models/Assignment';
import type { ApiResponse, QuestionDifficulty } from '../types/index';

export async function getPaper(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const paper = await GeneratedPaper.findById(id).lean();
    if (!paper) {
      res.status(404).json({
        success: false,
        error: 'Generated paper not found',
      } satisfies ApiResponse<never>);
      return;
    }

    const assignment = await Assignment.findById(paper.assignmentId).lean();

    res.json({
      success: true,
      data: { paper, assignment },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaperByAssignment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params; // this is assignmentId

    const paper = await GeneratedPaper.findOne({ assignmentId: id }).lean();
    if (!paper) {
      res.status(404).json({
        success: false,
        error: 'Generated paper not found for this assignment',
      } satisfies ApiResponse<never>);
      return;
    }

    const assignment = await Assignment.findById(id).lean();

    res.json({
      success: true,
      data: { paper, assignment },
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const paper = await GeneratedPaper.findById(id).lean();
    if (!paper) {
      res.status(404).json({
        success: false,
        error: 'Generated paper not found',
      } satisfies ApiResponse<never>);
      return;
    }

    const assignment = await Assignment.findById(paper.assignmentId).lean();

    const totalMarks = paper.sections.reduce(
      (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.marks, 0),
      0
    );
    const totalQuestions = paper.sections.reduce((sum, s) => sum + s.questions.length, 0);
    const dueDate = assignment?.dueDate
      ? new Date(assignment.dueDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : 'N/A';

    const difficultyLabel = (d: QuestionDifficulty) =>
      ({ easy: 'Easy', medium: 'Moderate', hard: 'Challenging' }[d]);

    const html = generatePaperHTML(
      assignment?.subject || 'Assessment',
      dueDate,
      totalMarks,
      totalQuestions,
      paper.sections,
      difficultyLabel
    );

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      printBackground: true,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="exam-paper-${id}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  } catch (error) {
    next(error);
  }
}

function generatePaperHTML(
  subject: string,
  dueDate: string,
  totalMarks: number,
  totalQuestions: number,
  sections: Array<{
    title: string;
    instruction: string;
    questions: Array<{ text: string; difficulty: QuestionDifficulty; marks: number; type: string }>;
  }>,
  difficultyLabel: (d: QuestionDifficulty) => string
): string {
  let questionNumber = 1;

  const sectionsHtml = sections
    .map((section) => {
      const questionsHtml = section.questions
        .map((q) => {
          const num = questionNumber++;
          const diffColor = { easy: '#15803d', medium: '#b45309', hard: '#dc2626' }[q.difficulty];
          return `
          <div class="question">
            <span class="q-num">${num}.</span>
            <span class="q-text">${q.text}</span>
            <span class="q-meta">
              <span class="diff-badge" style="color: ${diffColor}">[${difficultyLabel(q.difficulty)}]</span>
              <span class="marks-badge">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</span>
            </span>
          </div>`;
        })
        .join('');

      return `
      <div class="section">
        <div class="section-header">${section.title}</div>
        <div class="section-instruction">${section.instruction}</div>
        <div class="questions">${questionsHtml}</div>
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #1a1a1a; line-height: 1.6; }
  .header { text-align: center; padding-bottom: 12px; border-bottom: 2px solid #1a1a1a; margin-bottom: 16px; }
  .header h1 { font-size: 16pt; font-weight: bold; }
  .header h2 { font-size: 13pt; font-weight: normal; margin-top: 4px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 11pt; margin: 12px 0; }
  .instructions { font-size: 11pt; font-style: italic; margin-bottom: 16px; padding: 8px 0; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
  .student-info { margin-bottom: 20px; }
  .student-info table { width: 100%; border-collapse: collapse; }
  .student-info td { padding: 6px 8px; border-bottom: 1px solid #999; font-size: 11pt; width: 33%; }
  .student-info td span { display: inline-block; width: 140px; border-bottom: 1px solid #333; }
  .section { margin-bottom: 24px; }
  .section-header { text-align: center; font-size: 13pt; font-weight: bold; padding: 8px; border: 1px solid #1a1a1a; margin-bottom: 8px; }
  .section-instruction { font-size: 10.5pt; font-style: italic; margin-bottom: 12px; color: #444; }
  .question { display: flex; gap: 8px; margin-bottom: 12px; font-size: 11.5pt; align-items: flex-start; }
  .q-num { font-weight: bold; min-width: 24px; }
  .q-text { flex: 1; }
  .q-meta { white-space: nowrap; font-size: 10pt; }
  .diff-badge { margin-right: 4px; font-weight: 600; }
  .marks-badge { color: #555; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #1a1a1a; text-align: center; font-size: 10pt; font-style: italic; color: #555; }
</style>
</head>
<body>
  <div class="header">
    <h1>Delhi Public School</h1>
    <h2>Subject: ${subject}</h2>
  </div>
  <div class="meta-row">
    <span>Time Allowed: —</span>
    <span>Maximum Marks: ${totalMarks}</span>
  </div>
  <div class="meta-row">
    <span>Total Questions: ${totalQuestions}</span>
    <span>Date: ${dueDate}</span>
  </div>
  <div class="instructions">All questions are compulsory unless stated otherwise.</div>
  <div class="student-info">
    <table>
      <tr>
        <td>Name: <span>&nbsp;</span></td>
        <td>Roll Number: <span>&nbsp;</span></td>
        <td>Class / Section: <span>&nbsp;</span></td>
      </tr>
    </table>
  </div>
  ${sectionsHtml}
  <div class="footer">— End of Question Paper —</div>
</body>
</html>`;
}
