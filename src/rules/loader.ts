import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Rule } from '../types.js';

function resolveRulesDirs(): string[] {
  // Prefer alongside dist (../rules), also check CWD/rules for dev
  // dist/.. = project root
  const here = new URL('', import.meta.url).pathname;
  // here ends with /dist/...
  const distDir = here.replace(/\/[^/]*$/, '');
  const projectRoot = distDir.replace(/\/dist\/?$/, '');
  return [join(projectRoot, 'rules'), join(process.cwd(), 'rules')];
}

async function readYaml(filePath: string): Promise<any | null> {
  try {
    // dynamic import to avoid hard dependency during tests
    const mod: any = await import('js-yaml');
    const text = await fs.readFile(filePath, 'utf8');
    return mod.load(text);
  } catch {
    return null;
  }
}

function validateRule(obj: any): Rule | null {
  if (!obj || typeof obj !== 'object') return null;
  const { id, title, severity, language, description, pattern } = obj;
  if (!id || !title || !severity || !language || !pattern) return null;
  let re: RegExp;
  try {
    if (typeof pattern === 'string') {
      // pattern is a plain regex source; use default flags 'i'
      re = new RegExp(pattern, 'i');
    } else if (pattern && typeof pattern.source === 'string') {
      re = new RegExp(pattern.source, pattern.flags ?? 'i');
    } else {
      return null;
    }
  } catch {
    return null;
  }
  return { id, title, severity, language, description, pattern: re } as Rule;
}

export async function loadYamlRules(): Promise<Rule[]> {
  const dirs = resolveRulesDirs();
  const results: Rule[] = [];
  for (const dir of dirs) {
    try {
      const entries = await fs.readdir(dir);
      for (const name of entries) {
        if (!name.endsWith('.yaml') && !name.endsWith('.yml')) continue;
        const full = join(dir, name);
        const data = await readYaml(full);
        if (Array.isArray(data)) {
          for (const item of data) {
            const r = validateRule(item);
            if (r) results.push(r);
          }
        } else if (data) {
          const r = validateRule(data);
          if (r) results.push(r);
        }
      }
    } catch {
      // ignore missing directories
    }
  }
  return results;
}

