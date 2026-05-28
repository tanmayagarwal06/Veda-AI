import { Request, Response, NextFunction } from 'express';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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

    const isProduction = process.env.NODE_ENV === 'production';
    const browser = await puppeteer.launch({
      args: isProduction ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: isProduction ? await chromium.executablePath() : undefined,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

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

const OPT = ['A', 'B', 'C', 'D'];
const SEC = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function answerLines(type: string, marks: number): string {
  if (type === 'MCQ' || type === 'True/False') return '';
  if (type === 'Diagram/Graph-Based') return '<div class="diagram-box"></div>';
  const count =
    type === 'Long Answer' ? Math.max(8, marks * 3) :
    type === 'Numerical'   ? 5 :
    Math.max(3, marks * 2);
  return `<div class="ans-lines">${'<div class="ans-line"></div>'.repeat(count)}</div>`;
}

function generatePaperHTML(
  subject: string,
  dueDate: string,
  totalMarks: number,
  totalQuestions: number,
  sections: Array<{
    title: string;
    instruction: string;
    questions: Array<{
      text: string;
      options?: string[];
      difficulty: QuestionDifficulty;
      marks: number;
      type: string;
    }>;
  }>,
  difficultyLabel: (d: QuestionDifficulty) => string
): string {
  const timeAllowed = Math.ceil(totalQuestions * 2.5);
  let qNum = 1;

  const sectionsHtml = sections.map((sec, si) => {
    const letter = SEC[si] ?? String(si + 1);
    const qs = sec.questions.map((q) => {
      const n = qNum++;
      const diffCls =
        q.difficulty === 'easy' ? 'diff-easy' :
        q.difficulty === 'hard' ? 'diff-hard' : 'diff-med';

      const optHtml = q.options && q.options.length > 0
        ? `<div class="options">${q.options.map((o, i) =>
            `<div class="opt"><span class="opt-key">${OPT[i]}.</span><span>${o}</span></div>`
          ).join('')}</div>`
        : '';

      const ansHtml = answerLines(q.type, q.marks);

      return `
      <div class="question">
        <span class="q-num">${n}.</span>
        <div class="q-body">
          <span class="q-text">${q.text}</span>
          ${optHtml}
          ${ansHtml}
        </div>
        <span class="q-meta">
          <span class="${diffCls}">${difficultyLabel(q.difficulty)}</span><br/>
          <span class="marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</span>
        </span>
      </div>`;
    }).join('');

    return `
    <div class="section">
      <div class="sec-header-row">
        <div class="sec-line"></div>
        <div class="sec-badge">SECTION ${letter}</div>
        <div class="sec-line"></div>
      </div>
      <div class="sec-title">${sec.title}</div>
      <div class="sec-instr">${sec.instruction}</div>
      ${qs}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11.5pt;
    color: #111;
    line-height: 1.55;
  }

  /* ── Header ── */
  .hdr { text-align: center; padding-bottom: 10px; border-bottom: 2.5px double #111; margin-bottom: 12px; }
  .hdr h1 { font-size: 17pt; font-weight: bold; letter-spacing: .3px; }
  .hdr h2 { font-size: 11.5pt; font-weight: normal; margin-top: 3px; color: #333; }

  /* ── Meta info ── */
  .meta { width: 100%; border-collapse: collapse; margin: 8px 0 10px; font-size: 11pt; }
  .meta td { padding: 2px 4px; }
  .meta .lbl { font-weight: bold; }
  .meta .right { text-align: right; }
  .meta .center { text-align: center; }

  /* ── General instructions ── */
  .instruct {
    font-size: 10.5pt; font-style: italic; color: #444;
    padding: 5px 0; border-top: 1px solid #bbb; border-bottom: 1px solid #bbb;
    margin-bottom: 12px;
  }

  /* ── Student info ── */
  .stu-row { display: flex; gap: 20px; margin-bottom: 18px; }
  .stu-field { flex: 1; }
  .stu-label { font-size: 10pt; font-weight: bold; margin-bottom: 3px; }
  .stu-line { border-bottom: 1.5px solid #333; min-height: 20px; }

  /* ── Section ── */
  .section { margin-bottom: 22px; }
  .sec-header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
  .sec-line { flex: 1; height: 1px; background: #999; }
  .sec-badge {
    font-size: 10.5pt; font-weight: bold; letter-spacing: 1.2px;
    border: 1.5px solid #555; padding: 2px 14px;
  }
  .sec-title { text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 2px; }
  .sec-instr { text-align: center; font-size: 10pt; font-style: italic; color: #555; margin-bottom: 10px; }

  /* ── Questions ── */
  .question {
    display: flex; gap: 8px; margin-bottom: 13px;
    page-break-inside: avoid; align-items: flex-start;
  }
  .q-num { font-weight: bold; min-width: 26px; flex-shrink: 0; padding-top: 1px; }
  .q-body { flex: 1; min-width: 0; }
  .q-text { display: block; }
  .q-meta { white-space: nowrap; font-size: 9.5pt; text-align: right; flex-shrink: 0; min-width: 80px; padding-top: 2px; }
  .diff-easy { color: #15803d; font-weight: 700; }
  .diff-med  { color: #b45309; font-weight: 700; }
  .diff-hard { color: #dc2626; font-weight: 700; }
  .marks { color: #555; }

  /* ── MCQ options ── */
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 18px; margin-top: 6px; }
  .opt { display: flex; gap: 5px; align-items: flex-start; font-size: 11pt; }
  .opt-key { font-weight: 700; min-width: 18px; flex-shrink: 0; color: #222; }

  /* ── Answer lines ── */
  .ans-lines { margin-top: 6px; }
  .ans-line { border-bottom: 1px solid #ccc; height: 22px; margin-bottom: 2px; }
  .diagram-box {
    margin-top: 8px; border: 1px solid #999;
    height: 140px; width: 100%;
  }

  /* ── Footer ── */
  .footer {
    margin-top: 22px; padding-top: 10px;
    border-top: 2px solid #111;
    text-align: center; font-size: 10pt; font-style: italic; color: #555;
  }
</style>
</head>
<body>
  <div class="hdr">
    <h1>Delhi Public School, Sector-4, Bokaro</h1>
    <h2>Subject: ${subject} &nbsp;|&nbsp; Class: 8th</h2>
  </div>

  <table class="meta">
    <tr>
      <td><span class="lbl">Time Allowed:</span> ${timeAllowed} minutes</td>
      <td class="center"><span class="lbl">Total Questions:</span> ${totalQuestions}</td>
      <td class="right"><span class="lbl">Maximum Marks:</span> ${totalMarks}</td>
    </tr>
    <tr>
      <td colspan="3" class="right"><span class="lbl">Date:</span> ${dueDate}</td>
    </tr>
  </table>

  <div class="instruct">
    General Instructions: All questions are compulsory unless stated otherwise.
    Read all questions carefully before answering.
  </div>

  <div class="stu-row">
    <div class="stu-field">
      <div class="stu-label">Name:</div>
      <div class="stu-line"></div>
    </div>
    <div class="stu-field">
      <div class="stu-label">Roll Number:</div>
      <div class="stu-line"></div>
    </div>
    <div class="stu-field">
      <div class="stu-label">Class / Section:</div>
      <div class="stu-line"></div>
    </div>
  </div>

  ${sectionsHtml}

  <div class="footer">— End of Question Paper —</div>
</body>
</html>`;
}
