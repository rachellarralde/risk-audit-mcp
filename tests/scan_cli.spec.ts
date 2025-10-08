import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';

function run(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = execFile('node', [join('dist', 'index.js'), ...args], { cwd }, (error, stdout, stderr) => {
      resolve({ stdout: String(stdout), stderr: String(stderr), code: (error as any)?.code ?? 0 });
    });
    child.on('error', () => resolve({ stdout: '', stderr: 'spawn error', code: 1 }));
  });
}

describe('CLI scan mode', () => {
  it('scans a directory and prints ASCII report', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vibe-')); 
    try {
      // Create a vulnerable JS file
      writeFileSync(join(dir, 'app.js'), "div.innerHTML = user;\n");
      // Run scan
      const { stdout, code } = await run(['--scan', dir, '--format', 'ascii']);
      expect(code).toBe(0);
      expect(stdout).toContain('Risk Audit Report');
      // should include Medium Priority header and a numbered list
      expect(stdout).toContain('Medium Priority');
      expect(stdout).toMatch(/\n\s*1\.\s/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('applies severityMin from .vibecheckrc to filter findings (JSON)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vibe-'));
    try {
      // Medium severity finding
      writeFileSync(join(dir, 'app.js'), "div.innerHTML = user;\n");
      // Config to only show critical
      writeFileSync(
        join(dir, '.vibecheckrc.json'),
        JSON.stringify({ severityMin: 'critical' })
      );
      const { stdout, code } = await run(['--scan', dir, '--format', 'json']);
      expect(code).toBe(0);
      const out = JSON.parse(stdout);
      expect(Array.isArray(out.findings)).toBe(true);
      expect(out.findings.length).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('renders unicode bars and emoji icons when requested', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vibe-'));
    try {
      // Critical finding (TS SQL concat)
      writeFileSync(join(dir, 'db.ts'), "db.query(\"SELECT 1\" + user);\n");
      const { stdout, code } = await run(['--scan', dir, '--format', 'ascii', '--style', 'unicode', '--icons', 'emoji']);
      expect(code).toBe(0);
      expect(stdout).toContain('['); // unicode-style uses brackets
      expect(stdout).toMatch(/[█░]/); // block characters present
      expect(stdout).toContain('⚠️'); // critical emoji present
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('hides rule IDs by default in ASCII output while keeping JSON ids', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vibe-'));
    try {
      writeFileSync(join(dir, 'app.js'), "div.innerHTML = user;\n");
      // ASCII default hides IDs
      const ascii = await run(['--scan', dir, '--format', 'ascii']);
      expect(ascii.code).toBe(0);
      expect(ascii.stdout).not.toMatch(/VBC\d{3}/);
      // JSON still contains ruleId
      const json = await run(['--scan', dir, '--format', 'json']);
      expect(json.code).toBe(0);
      const out = JSON.parse(json.stdout);
      const hasRuleId = out.findings.some((f: any) => typeof f.ruleId === 'string');
      expect(hasRuleId).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
