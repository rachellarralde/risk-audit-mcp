import { promises as fs } from 'node:fs';

export interface FixSuggestion {
  file: string;
  line: number;
  original: string;
  proposed: string;
  description: string;
}

export async function proposeFixesForFile(path: string): Promise<FixSuggestion[]> {
  let text: string;
  try {
    text = await fs.readFile(path, 'utf8');
  } catch {
    return [];
  }
  const lines = text.split(/\r?\n/);
  const suggestions: FixSuggestion[] = [];

  const push = (i: number, original: string, proposed: string, description: string) => {
    if (original !== proposed) {
      suggestions.push({ file: path, line: i + 1, original, proposed, description });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // JS/TS: innerHTML -> textContent (simple case)
    if (/\binnerHTML\s*=/.test(l)) {
      push(i, l, l.replace(/innerHTML\s*=/, 'textContent ='), 'Prefer textContent over innerHTML to avoid XSS.');
    }
    // JS/TS: child_process.exec -> execFile (basic)
    if (/child_process\.(?:exec)\s*\(/.test(l)) {
      push(i, l, l.replace(/child_process\.exec\s*\(/, 'child_process.execFile('), 'Use execFile with args array instead of exec.');
    }
    // Python: subprocess.*(shell=True) -> remove shell=True (naive)
    if (/subprocess\.(?:run|Popen|call|check_output)\s*\(/.test(l) && /shell\s*=\s*True/.test(l)) {
      push(i, l, l.replace(/,?\s*shell\s*=\s*True\s*/, ' '), 'Avoid shell=True; pass an args list and validate inputs.');
    }
  }

  return suggestions;
}

export function formatSuggestionsAsPatch(suggestions: FixSuggestion[]): string {
  if (suggestions.length === 0) return 'No quick-fix suggestions found.';
  const byFile = new Map<string, FixSuggestion[]>();
  for (const s of suggestions) {
    const arr = byFile.get(s.file) ?? [];
    arr.push(s);
    byFile.set(s.file, arr);
  }
  const chunks: string[] = [];
  for (const [file, list] of byFile) {
    chunks.push(`--- ${file}`);
    chunks.push(`+++ ${file} (proposed)`);
    for (const s of list) {
      chunks.push(`@@ line ${s.line} @@`);
      chunks.push(`- ${s.original}`);
      chunks.push(`+ ${s.proposed}`);
      chunks.push(`# ${s.description}`);
    }
  }
  return chunks.join('\n');
}

