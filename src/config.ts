import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Rule, Severity, Finding } from './types.js';

export interface Config {
  include?: string[];
  exclude?: string[];
  severityMin?: Severity;
  rules?: {
    disable?: string[];
    enable?: string[];
  };
}

export async function loadConfig(root: string): Promise<Config | null> {
  const paths = [
    join(root, '.vibecheckrc'),
    join(root, '.vibecheckrc.yaml'),
    join(root, '.vibecheckrc.yml'),
    join(root, '.vibecheckrc.json')
  ];
  for (const p of paths) {
    try {
      const text = await fs.readFile(p, 'utf8');
      if (p.endsWith('.json')) return JSON.parse(text);
      // Try YAML
      const mod: any = await import('js-yaml');
      return mod.load(text) as Config;
    } catch {
      /* continue */
    }
  }
  return null;
}

const order: Severity[] = ['low', 'medium', 'critical'];

export function applyConfigToRules(rules: Rule[], cfg?: Config | null): Rule[] {
  if (!cfg || !cfg.rules) return rules;
  const disable = new Set(cfg.rules.disable ?? []);
  const enable = new Set(cfg.rules.enable ?? []);
  return rules.filter((r) => (enable.size ? enable.has(r.id) : true) && !disable.has(r.id));
}

export function filterFindingsBySeverity(findings: Finding[], min?: Severity): Finding[] {
  if (!min) return findings;
  const minIdx = order.indexOf(min);
  return findings.filter((f) => order.indexOf(f.severity) >= minIdx);
}

