import { promises as fs } from 'node:fs';
import { join, extname } from 'node:path';

export interface WalkOptions {
  root: string;
  include?: string[]; // substrings to include
  exclude?: string[]; // substrings to exclude
}

const DEFAULT_EXCLUDES = ['node_modules', '.git', 'dist', 'build', '.next', '.venv', '__pycache__'];

export async function walkFiles(opts: WalkOptions): Promise<string[]> {
  const out: string[] = [];
  const include = opts.include ?? [];
  const exclude = [...DEFAULT_EXCLUDES, ...(opts.exclude ?? [])];

  async function walk(dir: string) {
    let entries: any[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const p = join(dir, ent.name);
      if (exclude.some((ex) => p.includes(ex))) continue;
      if (ent.isDirectory()) {
        await walk(p);
      } else if (ent.isFile()) {
        if (include.length === 0 || include.some((inc) => p.includes(inc))) {
          out.push(p);
        }
      }
    }
  }

  await walk(opts.root);
  return out;
}

export function detectLanguage(path: string): 'js' | 'ts' | 'python' | 'any' {
  const ext = extname(path).toLowerCase();
  if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return 'js';
  if (ext === '.ts' || ext === '.tsx') return 'ts';
  if (ext === '.py') return 'python';
  return 'any';
}

