import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

// ─── Tailwind class merger ─────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy');
  } catch {
    return dateStr;
  }
}

// ─── Difficulty labels and styles ─────────────────────────────────────────────
export const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    color: 'text-difficulty-easy',
    bg: 'bg-difficulty-easy-bg',
    border: 'border-difficulty-easy/30',
    dot: 'bg-difficulty-easy',
  },
  medium: {
    label: 'Moderate',
    color: 'text-difficulty-medium',
    bg: 'bg-difficulty-medium-bg',
    border: 'border-difficulty-medium/30',
    dot: 'bg-difficulty-medium',
  },
  hard: {
    label: 'Challenging',
    color: 'text-difficulty-hard',
    bg: 'bg-difficulty-hard-bg',
    border: 'border-difficulty-hard/30',
    dot: 'bg-difficulty-hard',
  },
} as const;

// ─── Section letter mapping (A, B, C...) ──────────────────────────────────────
export function getSectionLetter(index: number): string {
  return String.fromCharCode(65 + index); // A=65
}

// ─── Pluralize ─────────────────────────────────────────────────────────────────
export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? 's' : ''}`;
}

// ─── Generate nanoid-style short ID ───────────────────────────────────────────
export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Status config ─────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-veda-gray-500', bg: 'bg-veda-gray-100' },
  processing: { label: 'Generating…', color: 'text-veda-orange', bg: 'bg-veda-orange-light' },
  done: { label: 'Done', color: 'text-difficulty-easy', bg: 'bg-difficulty-easy-bg' },
  failed: { label: 'Failed', color: 'text-difficulty-hard', bg: 'bg-difficulty-hard-bg' },
} as const;
