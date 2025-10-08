import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function runNode(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = execFile('node', [join('dist', 'index.js'), ...args], (error, stdout, stderr) => {
      const code = (error as any)?.code ?? 0;
      resolve({ stdout: String(stdout), stderr: String(stderr), code });
    });
    // In case execFile throws synchronously (unlikely)
    child.on('error', () => {
      resolve({ stdout: '', stderr: 'spawn error', code: 1 });
    });
  });
}

function runNodeCwd(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const script = join(process.cwd(), 'dist', 'index.js');
    const child = execFile('node', [script, ...args], { cwd }, (error, stdout, stderr) => {
      const code = (error as any)?.code ?? 0;
      resolve({ stdout: String(stdout), stderr: String(stderr), code });
    });
    child.on('error', () => {
      resolve({ stdout: '', stderr: 'spawn error', code: 1 });
    });
  });
}

describe('Phase 0 CLI skeleton', () => {
  it('--version prints package version', async () => {
    const pkg = JSON.parse(readFileSync(join('package.json'), 'utf8'));
    const { stdout, code } = await runNode(['--version']);
    expect(code).toBe(0);
    expect(stdout.trim()).toBe(pkg.version);
  });

  it('--help prints usage with name and options', async () => {
    const pkg = JSON.parse(readFileSync(join('package.json'), 'utf8'));
    const { stdout, code } = await runNode(['--help']);
    expect(code).toBe(0);
    expect(stdout).toContain(pkg.name);
    expect(stdout).toContain('--help');
    expect(stdout).toContain('--version');
    expect(stdout).toContain('--check');
  });

  it('--check returns a ready message and exit 0', async () => {
    const { stdout, code } = await runNode(['--check']);
    expect(code).toBe(0);
    expect(stdout).toContain('Vibe Check MCP skeleton is ready');
  });

  it('default run performs a quick scan with unicode bars and emoji icons', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vibe-cli-'));
    try {
      writeFileSync(join(dir, 'app.js'), 'div.innerHTML = user\n');
      const { stdout, code } = await runNodeCwd([], dir);
      expect(code).toBe(0);
      expect(stdout).toContain('Risk Audit Report');
      expect(stdout).toMatch(/[█░]/); // unicode bar characters
      // Emoji icons only appear in section headers now
      expect(stdout).toContain('🔍');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
