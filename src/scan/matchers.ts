import type { Finding, Rule } from '../types.js';
import { makeLineIndex, toRange, sliceRange } from './utils.js';

export function scanText(
  content: string,
  rules: Rule[],
  opts?: { language?: Rule['language']; file?: string }
): Finding[] {
  const lang = opts?.language ?? 'any';
  const lines = makeLineIndex(content);
  const findings: Finding[] = [];

  for (const rule of rules) {
    if (rule.language !== 'any' && lang !== 'any' && rule.language !== lang) continue;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g');
    let m: RegExpExecArray | null;
    let matchCount = 0;
    while ((m = re.exec(content))) {
      const start = m.index;
      const end = start + m[0].length;
      findings.push({
        id: `${rule.id}:${opts?.file ?? 'memory'}:${start}-${end}`,
        ruleId: rule.id,
        severity: rule.severity,
        file: opts?.file,
        range: toRange(lines, start, end),
        snippet: sliceRange(content, start, end),
        message: rule.title,
        fix: rule.fix
      });
      // avoid infinite loops on zero-length matches
      if (re.lastIndex === m.index) re.lastIndex++;
      matchCount++;
      if (matchCount >= 200) break; // safety cap per rule per file
    }
  }

  return findings;
}
