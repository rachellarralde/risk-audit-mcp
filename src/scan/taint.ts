import type { Rule } from '../types.js';

export function collectTaintedVariables(content: string, language: Rule['language']): Set<string> {
  const set = new Set<string>();
  const add = (m?: RegExpMatchArray | null, idx = 1) => {
    if (m && m[idx]) set.add(m[idx]);
  };

  if (language === 'python') {
    const patterns = [
      /(\w+)\s*=\s*request\.(?:args|get_json|form|values|data)\b/g,
      /(\w+)\s*=\s*os\.environ\b/g
    ];
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(content))) add(m, 1);
    }
  } else {
    const patterns = [
      /const\s+([A-Za-z_$][\w$]*)\s*=\s*req\.(?:query|params|body)\b/g,
      /let\s+([A-Za-z_$][\w$]*)\s*=\s*req\.(?:query|params|body)\b/g,
      /var\s+([A-Za-z_$][\w$]*)\s*=\s*req\.(?:query|params|body)\b/g,
      /([A-Za-z_$][\w$]*)\s*=\s*window\.location\b/g,
      /([A-Za-z_$][\w$]*)\s*=\s*document\.location\b/g
    ];
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(content))) add(m, 1);
    }
  }
  return set;
}

