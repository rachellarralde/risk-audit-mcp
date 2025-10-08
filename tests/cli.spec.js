import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
function runNode(args) {
    return new Promise((resolve) => {
        const child = execFile('node', [join('dist', 'index.js'), ...args], (error, stdout, stderr) => {
            const code = error?.code ?? 0;
            resolve({ stdout: String(stdout), stderr: String(stderr), code });
        });
        // In case execFile throws synchronously (unlikely)
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
    it('default run prints banner', async () => {
        const { stdout, code } = await runNode([]);
        expect(code).toBe(0);
        expect(stdout).toContain('Phase 0 Skeleton');
    });
});
//# sourceMappingURL=cli.spec.js.map