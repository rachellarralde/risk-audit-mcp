import type { Finding, Severity } from '../types.js';
import { colors } from './colors.js';
import { basename } from 'node:path';

type Style = 'ascii' | 'unicode';
type IconSet = 'ascii' | 'emoji';

function icon(sev: Severity, set: IconSet): string {
  if (set === 'emoji') {
    if (sev === 'critical') return '⚠️❗';
    if (sev === 'medium') return '🔍';
    return 'ⓘ';
  }
  // ASCII-only, consistent width icons
  if (sev === 'critical') return '/!\\'; // hazard
  if (sev === 'medium') return '(!)'; // caution
  return '(.)'; // info/low
}

function bar(done: number, total: number, width = 24, style: Style = 'ascii'): string {
  const ratio = total === 0 ? 0 : Math.max(0, Math.min(1, done / total));
  const filled = Math.round(width * ratio);
  const empty = width - filled;
  const pct = total === 0 ? 0 : Math.round(ratio * 100);
  if (style === 'unicode') {
    const fillChar = '█';
    const emptyChar = '░';
    return `[${fillChar.repeat(filled)}${emptyChar.repeat(empty)}] ${done}/${total} (${pct}%)`;
  }
  // ASCII dotted bar: '|' + '='*filled + '.'*empty + '|  x/y (p%)'
  return `|${'='.repeat(filled)}${'.'.repeat(empty)}| ${done}/${total} (${pct}%)`;
}

export interface AsciiOptions {
  title?: string;
  style?: Style; // ascii | unicode
  icons?: IconSet; // ascii | emoji
  barWidth?: number;
  showRuleIds?: boolean; // default true
}

export function renderAscii(findings: Finding[], opts?: AsciiOptions): string {
  const bySev: Record<Severity, Finding[]> = {
    critical: [],
    medium: [],
    low: []
  };
  for (const f of findings) bySev[f.severity].push(f);

  const total = findings.length;
  const header = [
    colors.bold('=== Risk Audit Report ==='),
    `Overall: ${bar(total, total, opts?.barWidth ?? 24, opts?.style ?? 'ascii')}`,
    ''
  ];

  const sections: string[] = [];
  const order: Severity[] = ['critical', 'medium', 'low'];
  for (const sev of order) {
    const group = bySev[sev];
    const titleText = sev === 'critical' ? 'Critical (fix immediately)' : sev === 'medium' ? 'Medium Priority' : 'Low Priority';
    const emojiPrefix = (opts?.icons ?? 'ascii') === 'emoji' ? (sev === 'critical' ? '⚠️ ' : sev === 'medium' ? '🔍 ' : 'ⓘ ') : '';
    const coloredTitle = sev === 'critical' ? colors.red(titleText) : sev === 'medium' ? colors.yellow(titleText) : colors.cyan(titleText);
    sections.push(`${emojiPrefix}${coloredTitle}: ${bar(group.length, total, opts?.barWidth ?? 24, opts?.style ?? 'ascii')}`);
    group.forEach((f, idx) => {
      const fileLabel = f.file ? `${basename(f.file)}` : 'offset';
      const locRaw = f.file ? `${fileLabel}:${f.range.start.line}-${f.range.end.line}` : `offset`;
      const loc = colors.green(locRaw);
      const head = (opts?.showRuleIds ?? false) ? `${f.ruleId} ${f.message}` : `${f.message}`;
      sections.push(`${idx + 1}. ${head} — ${loc}`);
      if (f.fix) {
        sections.push(`     fix: ${f.fix}`);
      }
    });
    sections.push('');
  }

  return [...header, ...sections].join('\n');
}
