import { promises as fs } from 'node:fs';
import type { Finding, Rule } from '../types.js';
import { scanText } from './matchers.js';
import { detectLanguage, walkFiles } from './fs.js';
import { builtinRules } from '../rules/builtin.js';
import { loadYamlRules } from '../rules/loader.js';
import { applyConfigToRules, filterFindingsBySeverity, loadConfig } from '../config.js';
import { collectTaintedVariables } from './taint.js';
import { createHash } from 'node:crypto';

export interface ScanProjectOptions {
  root: string;
  include?: string[];
  exclude?: string[];
}

export interface ScanResult {
  findings: Finding[];
}

function stableId(file: string | undefined, start: number, end: number, ruleId: string): string {
  const h = createHash('sha1');
  h.update(`${file ?? ''}:${start}-${end}:${ruleId}`);
  return h.digest('hex').slice(0, 12);
}

export async function scanFile(path: string, extraRules?: Rule[]): Promise<Finding[]> {
  let content: string;
  try {
    content = await fs.readFile(path, 'utf8');
  } catch {
    return [];
  }
  const language = detectLanguage(path);
  const cfg = await loadConfig(process.cwd()).catch(() => null);
  const rules = applyConfigToRules(
    [...builtinRules, ...((await loadYamlRules().catch(() => [])) as Rule[]), ...(extraRules ?? [])],
    cfg
  );
  const raw = scanText(content, rules, { language, file: path });
  const tainted = collectTaintedVariables(content, language);
  // de-dupe and attach stable IDs
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const f of raw) {
    const key = `${f.ruleId}:${f.file}:${f.range.start.line}:${f.range.start.column}-${f.range.end.line}:${f.range.end.column}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // If snippet contains a tainted variable name, annotate the message
    const taintedName = [...tainted].find((t) => f.snippet.includes(t));
    const message = taintedName ? `${f.message} [tainted: ${taintedName}]` : f.message;
    out.push({ ...f, message, id: stableId(f.file, f.range.start.line, f.range.end.line, f.ruleId) });
  }
  return filterFindingsBySeverity(out, cfg?.severityMin);
}

export async function scanProject(opts: ScanProjectOptions): Promise<ScanResult> {
  const cfg = await loadConfig(opts.root).catch(() => null);
  const include = opts.include ?? cfg?.include;
  const exclude = opts.exclude ?? cfg?.exclude;
  const files = await walkFiles({ root: opts.root, include, exclude });
  const findings: Finding[] = [];
  const rules = applyConfigToRules(
    [...builtinRules, ...((await loadYamlRules().catch(() => [])) as Rule[])],
    cfg
  );
  for (const file of files) {
    let content: string;
    try {
      content = await fs.readFile(file, 'utf8');
    } catch {
      continue;
    }
    const language = detectLanguage(file);
    const raw = scanText(content, rules, { language, file });
    findings.push(...raw);
  }
  return { findings: filterFindingsBySeverity(findings, cfg?.severityMin) };
}
