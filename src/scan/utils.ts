import type { Position, Range } from '../types.js';

export function makeLineIndex(text: string): number[] {
  const lines: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') lines.push(i + 1);
  }
  return lines;
}

export function offsetToPos(lines: number[], offset: number): Position {
  // binary search for the line
  let lo = 0;
  let hi = lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid] <= offset) lo = mid + 1;
    else hi = mid - 1;
  }
  const lineStart = lines[Math.max(0, lo - 1)];
  return { line: Math.max(1, lo), column: offset - lineStart + 1 };
}

export function sliceRange(text: string, start: number, end: number): string {
  return text.slice(start, end);
}

export function toRange(lines: number[], start: number, end: number): Range {
  return { start: offsetToPos(lines, start), end: offsetToPos(lines, end) };
}

