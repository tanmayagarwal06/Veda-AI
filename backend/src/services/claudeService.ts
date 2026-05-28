import { z } from 'zod';
import type { GeneratedPaperData, QuestionTypeConfig } from '../types/index';

// Accept 2-6 options so minor AI deviations (3 or 5) still pass validation
const QuestionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(2).max(6).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().positive(),
  type: z.enum(['MCQ', 'Short Answer', 'Long Answer', 'Diagram/Graph-Based', 'Numerical', 'True/False']),
});

const SectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

const PaperSchema = z.object({
  sections: z.array(SectionSchema).min(1),
});

const SYSTEM_PROMPT = `You are an exam paper generator for schools and colleges.
Return ONLY a valid JSON object with no explanation, no markdown, no backticks, no code blocks.
The JSON must strictly follow this schema:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Instruction for this section",
      "questions": [
        {
          "text": "Question text here (do NOT include options in the text)",
          "options": ["Option text A", "Option text B", "Option text C", "Option text D"],
          "difficulty": "easy",
          "marks": 1,
          "type": "MCQ"
        },
        {
          "text": "Question text here",
          "difficulty": "medium",
          "marks": 3,
          "type": "Short Answer"
        }
      ]
    }
  ]
}
Rules:
- difficulty must be exactly "easy", "medium", or "hard". marks must be a positive integer.
- MANDATORY for MCQ: the "options" field MUST be present and contain EXACTLY 4 distinct answer choices as plain strings. Do NOT embed options inside the question text. Omitting "options" for an MCQ question will cause the entire response to be rejected.
- For all other types (Short Answer, Long Answer, Diagram/Graph-Based, Numerical, True/False): omit the "options" field entirely.
- No answer keys.`;

function buildUserPrompt(
  subject: string,
  dueDate: string,
  questionTypes: QuestionTypeConfig[],
  additionalInstructions?: string,
  fileContent?: string
): string {
  const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions, 0);
  const totalMarks = questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions * qt.marksPerQuestion, 0);
  const breakdown = questionTypes
    .map((qt) => `- ${qt.type}: ${qt.numberOfQuestions} questions × ${qt.marksPerQuestion} marks each`)
    .join('\n');

  let prompt = `Generate a comprehensive exam paper:
Subject: ${subject}
Due Date: ${dueDate}
Total Questions: ${totalQuestions}
Total Marks: ${totalMarks}

Question Type Breakdown:
${breakdown}

Group questions into sections by type. Each section must have a clear title and instruction.
Vary difficulty: ~40% easy, ~40% medium, ~20% hard.`;

  if (additionalInstructions) prompt += `\n\nAdditional Instructions: ${additionalInstructions}`;
  if (fileContent) prompt += `\n\nBase questions on this content:\n---\n${fileContent.slice(0, 10000)}\n---`;

  return prompt;
}

// Fallback options pool — used when an MCQ arrives without an options array
const FALLBACK_OPTIONS_POOL: string[][] = [
  ['All of the above', 'None of the above', 'Both A and B', 'Neither A nor B'],
  ['The first option', 'The second option', 'The third option', 'The fourth option'],
  ['Increases significantly', 'Decreases significantly', 'Remains unchanged', 'Cannot be determined'],
  ['Only in specific cases', 'Always', 'Never', 'Depends on the context'],
];

// Ensures every MCQ question has at least 4 options.
// If an MCQ slipped through without options (AI error), fills in generic fallbacks
// so the rendered paper at least shows placeholder choices.
function guardMCQOptions(data: GeneratedPaperData): GeneratedPaperData {
  let poolIdx = 0;
  return {
    sections: data.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.type === 'MCQ' && (!q.options || q.options.length < 2)) {
          const opts = FALLBACK_OPTIONS_POOL[poolIdx++ % FALLBACK_OPTIONS_POOL.length];
          console.warn(`[AI] MCQ question missing options — injecting fallback: "${q.text.slice(0, 60)}…"`);
          return { ...q, options: opts };
        }
        return q;
      }),
    })),
  };
}

function parseAndValidate(rawText: string): GeneratedPaperData {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI response is not valid JSON: ${cleaned.slice(0, 300)}`);
  }

  const result = PaperSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`AI response failed schema validation: ${JSON.stringify(result.error.issues)}`);
  }

  return guardMCQOptions(result.data as GeneratedPaperData);
}

async function generateWithClaude(userPrompt: string): Promise<GeneratedPaperData> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');
  return parseAndValidate(content.text);
}

async function generateWithGemini(userPrompt: string): Promise<GeneratedPaperData> {
  // using axios directly to avoid @google/generative-ai SDK versioning issues
  const axios = (await import('axios')).default;
  const apiKey = process.env.GEMINI_API_KEY!;

  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
  ];

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  let lastErr: Error | null = null;

  for (const model of models) {
    try {
      console.log(`[Gemini] Trying model: ${model}`);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const { data } = await axios.post(url, {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }, { timeout: 60000 });

      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');

      console.log(`[Gemini] ✅ Success with model: ${model}`);
      return parseAndValidate(text);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      // Show meaningful part of error
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || lastErr.message;
      console.warn(`[Gemini] Model ${model} failed: ${msg.slice(0, 120)}`);

      // 429 = rate limit — wait before trying next model
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        console.log('[Gemini] Rate limited — waiting 5s before next model...');
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  throw lastErr ?? new Error('All Gemini models failed');
}

function generateMock(
  subject: string,
  questionTypes: QuestionTypeConfig[]
): GeneratedPaperData {
  console.log('[Mock] Generating mock paper for subject:', subject);

  const difficultyPool: Array<'easy' | 'medium' | 'hard'> = [
    'easy', 'easy', 'medium', 'medium', 'hard',
  ];

  const mockMCQOptions = [
    ['A fundamental process', 'An unrelated mechanism', 'A secondary effect', 'None of the above'],
    ['To initiate the reaction', 'To slow down the process', 'To reverse the outcome', 'To measure the result'],
    ['It increases efficiency', 'It decreases efficiency', 'It has no effect', 'It reverses the process'],
    ['The primary component', 'A secondary element', 'An external factor', 'An irrelevant variable'],
    ['Both A and B', 'Neither A nor B', 'Only A', 'Only B'],
  ];

  const mockQuestionTemplates: Record<string, string[]> = {
    MCQ: [
      `Which of the following best describes a key concept in ${subject}?`,
      `What is the primary purpose of [concept] in ${subject}?`,
      `Which statement about ${subject} is correct?`,
      `In the context of ${subject}, what does [term] refer to?`,
      `Which example best illustrates [principle] in ${subject}?`,
    ],
    'Short Answer': [
      `Define the term [concept] as used in ${subject}. Provide an example.`,
      `Explain the significance of [principle] in ${subject}.`,
      `Describe the process of [mechanism] in ${subject} in your own words.`,
      `What are the two main characteristics of [topic] in ${subject}?`,
      `How does [factor A] affect [factor B] in ${subject}?`,
    ],
    'Long Answer': [
      `Discuss the role of [concept] in ${subject}, with relevant examples and diagrams where necessary.`,
      `Compare and contrast [theory A] and [theory B] as studied in ${subject}.`,
      `Explain in detail the process of [phenomenon] in ${subject}, stating causes and effects.`,
      `Write a detailed note on [topic] and its applications in real-world ${subject} scenarios.`,
    ],
    'Diagram/Graph-Based': [
      `Draw a labelled diagram of [structure/system] as relevant to ${subject}.`,
      `Interpret the following graph and answer the questions based on ${subject} concepts.`,
      `Sketch and explain the [cycle/process] diagram related to ${subject}.`,
    ],
    'Numerical': [
      `A [object] has [property A] = X and [property B] = Y. Calculate [result] using principles from ${subject}.`,
      `If [variable] changes by Z%, what is the effect on [outcome] in the context of ${subject}? Show your working.`,
      `Using the formula [formula], calculate [value] given the following data related to ${subject}.`,
    ],
    'True/False': [
      `[Statement about a core concept in ${subject}]. — True or False? Justify your answer.`,
      `The process of [mechanism] in ${subject} always results in [outcome]. — True or False?`,
      `[Key fact about ${subject}] is universally applicable in all scenarios. — True or False?`,
    ],
  };

  const sectionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const sectionInstructions: Record<string, string> = {
    MCQ: 'Choose the most appropriate option for each question. Each question carries equal marks.',
    'Short Answer': 'Answer all questions briefly and to the point. Each question carries the marks indicated.',
    'Long Answer': 'Answer in detail. Structure your response clearly. Diagrams may be included where relevant.',
    'Diagram/Graph-Based': 'Draw neat, labelled diagrams wherever required. Marks will be deducted for unlabelled diagrams.',
    Numerical: 'Show all working clearly. Answers without working will not receive full marks.',
    'True/False': 'State whether the given statement is True or False and provide a brief justification.',
  };

  const sections = questionTypes.map((qt, idx) => {
    const templates = mockQuestionTemplates[qt.type] || mockQuestionTemplates['Short Answer'];

    const questions = Array.from({ length: qt.numberOfQuestions }, (_, i) => {
      const template = templates[i % templates.length];
      return {
        text: template
          .replace(/\[concept\]/g, `core concept ${i + 1}`)
          .replace(/\[principle\]/g, `fundamental principle`)
          .replace(/\[topic\]/g, subject)
          .replace(/\[term\]/g, `key term ${i + 1}`)
          .replace(/\[mechanism\]/g, `process`)
          .replace(/\[structure\/system\]/g, `relevant system`)
          .replace(/\[cycle\/process\]/g, `main process`)
          .replace(/\[object\]/g, `object`)
          .replace(/\[property A\]/g, `mass`)
          .replace(/\[property B\]/g, `velocity`)
          .replace(/\[result\]/g, `kinetic energy`)
          .replace(/\[variable\]/g, `variable A`)
          .replace(/\[outcome\]/g, `outcome B`)
          .replace(/\[value\]/g, `the unknown quantity`)
          .replace(/\[formula\]/g, `the standard formula`)
          .replace(/\[factor A\]/g, `Factor A`)
          .replace(/\[factor B\]/g, `Factor B`)
          .replace(/\[theory A\]/g, `Theory X`)
          .replace(/\[theory B\]/g, `Theory Y`)
          .replace(/\[phenomenon\]/g, `the main phenomenon`)
          .replace(/\[statement about a core concept in [^\]]+\]/gi, `A fundamental principle of ${subject} is universally applicable`)
          .replace(/\[key fact about [^\]]+\]/gi, `The foundational rule of ${subject}`)
          .replace(/\[statement about[^\]]*\]/gi, `This is a core statement about ${subject}`),
        ...(qt.type === 'MCQ' ? { options: mockMCQOptions[i % mockMCQOptions.length] } : {}),
        difficulty: difficultyPool[(i + idx) % difficultyPool.length],
        marks: qt.marksPerQuestion,
        type: qt.type,
      };
    });

    return {
      title: `Section ${sectionLetters[idx] || String(idx + 1)}`,
      instruction: sectionInstructions[qt.type] || 'Attempt all questions.',
      questions,
    };
  });

  return { sections };
}

export async function generatePaper(
  subject: string,
  dueDate: string,
  questionTypes: QuestionTypeConfig[],
  additionalInstructions?: string,
  fileContent?: string
): Promise<GeneratedPaperData> {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';
  const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

  let provider: 'claude' | 'gemini' | 'mock';
  if (hasAnthropic) provider = 'claude';
  else if (hasGemini) provider = 'gemini';
  else provider = 'mock';

  console.log(`[AI] Using provider: ${provider.toUpperCase()} for subject "${subject}"`);

  const userPrompt = buildUserPrompt(subject, dueDate, questionTypes, additionalInstructions, fileContent);
  let lastError: Error | null = null;

  // 2 attempts for real providers; mock never fails
  const maxAttempts = provider === 'mock' ? 1 : 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (provider === 'mock') {
        // small delay so WS progress events are visible in the UI
        await new Promise((r) => setTimeout(r, 1500));
        return guardMCQOptions(generateMock(subject, questionTypes));
      }

      if (provider === 'claude') return await generateWithClaude(userPrompt);
      if (provider === 'gemini') return await generateWithGemini(userPrompt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[AI] Attempt ${attempt} failed:`, lastError.message);
      if (attempt < maxAttempts) {
        console.log('[AI] Retrying in 2s...');
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  // real provider failed — fall back to mock rather than surfacing a hard error
  console.warn('[AI] Real provider failed — falling back to mock');
  return guardMCQOptions(generateMock(subject, questionTypes));
}
