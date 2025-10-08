#!/usr/bin/env node
/*
  Vibe Check MCP — Phase 0 Skeleton
  - No MCP wiring yet (arrives in Phase 1)
  - Provides basic CLI flags to validate the bootstrap and support tests
*/

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getPackageJson(): { name: string; version: string; description?: string } {
  const pkgPath = join(__dirname, '..', 'package.json');
  const raw = readFileSync(pkgPath, 'utf8');
  return JSON.parse(raw);
}

function printHelp(): void {
  const pkg = getPackageJson();
  const lines = [
    `${pkg.name} v${pkg.version}`,
    `${pkg.description ?? ''}`,
    '',
    'Usage:',
    '  risk-audit [--help] [--version] [--check] [--mcp-stdio] [--scan <path>] [--format ascii|json] [--style ascii|unicode] [--icons ascii|emoji] [--show-ids] [--sarif <file>] [--propose-fixes] [--quick]',
    '',
    'Options:',
    '  --help       Show this help',
    '  --version    Show version',
    '  --check      Print a skeleton startup message and exit 0',
    '  --mcp-stdio  Start MCP server over stdio',
    '  --scan PATH  Scan a file or directory (CLI mode)',
    '  --format     Output format for --scan: ascii|json (default: ascii)',
    '  --style      Bar style: ascii or unicode (default: ascii)',
    '  --icons      Icon set: ascii or emoji (default: ascii)',
    '  --show-ids   Show rule IDs in ASCII output (hidden by default)',
    '  --sarif FILE Write findings as SARIF JSON to FILE',
    '  --propose-fixes  Print dry-run patch suggestions for quick fixes',
    '  --quick      Shortcut: --scan . --format ascii --style unicode --icons emoji',
    '',
    'Notes:',
    '  Default (no args) runs the quick scan with unicode bars + emoji icons.'
  ];
  process.stdout.write(lines.join('\n') + '\n');
}

function printVersion(): void {
  const { version } = getPackageJson();
  process.stdout.write(version + '\n');
}

async function main(argv: string[]): Promise<number> {
  if (argv.includes('--help')) {
    printHelp();
    return 0;
  }
  if (argv.includes('--version')) {
    printVersion();
    return 0;
  }
  if (argv.includes('--check')) {
    process.stdout.write('[ok] Vibe Check MCP skeleton is ready.\n');
    return 0;
  }

  if (argv.includes('--mcp-stdio')) {
    // Start the MCP server. This function dynamically loads the SDK.
    try {
      const m = await import('./mcp.js');
      process.stdout.write('[ok] Starting MCP server on stdio...\n');
      await m.startMcpServerStdio();
      // If connect resolves, we can exit.
      return 0;
    } catch (err: any) {
      process.stderr.write(`Failed to start MCP server: ${String(err?.message ?? err)}\n`);
      return 1;
    }
  }

  // Quick alias: scan current directory with unicode bars + emoji icons
  if (argv.includes('--quick')) {
    const { scanProject } = await import('./scan/engine.js');
    const { renderAscii } = await import('./report/ascii.js');
    try {
      const res = await scanProject({ root: process.cwd() });
      process.stdout.write(
        renderAscii(res.findings, { style: 'unicode', icons: 'emoji' }) + '\n'
      );
      return 0;
    } catch (err: any) {
      process.stderr.write(`Scan failed: ${String(err?.message ?? err)}\n`);
      return 1;
    }
  }

  // CLI scan mode (not MCP): quick local verification
  const scanIdx = argv.indexOf('--scan');
  if (scanIdx !== -1 && argv[scanIdx + 1]) {
    const target = argv[scanIdx + 1];
    const fmtIdx = argv.indexOf('--format');
    const format = fmtIdx !== -1 && argv[fmtIdx + 1] ? argv[fmtIdx + 1] : 'ascii';
    const { scanFile, scanProject } = await import('./scan/engine.js');
    const { renderAscii } = await import('./report/ascii.js');
    const { toSarif } = await import('./report/sarif.js');
    const { stat } = await import('node:fs/promises');
    try {
      const st = await stat(target);
      const styleIdx = argv.indexOf('--style');
      const iconsIdx = argv.indexOf('--icons');
      const style = (styleIdx !== -1 && argv[styleIdx + 1] ? argv[styleIdx + 1] : 'ascii') as 'ascii' | 'unicode';
      const icons = (iconsIdx !== -1 && argv[iconsIdx + 1] ? argv[iconsIdx + 1] : 'ascii') as 'ascii' | 'emoji';
      const showIds = argv.includes('--show-ids');
      const sarifIdx = argv.indexOf('--sarif');
      const sarifPath = sarifIdx !== -1 ? argv[sarifIdx + 1] : undefined;
      const propose = argv.includes('--propose-fixes');
      if (st.isFile()) {
        const findings = await scanFile(target);
        if (format === 'json') {
          process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n');
          if (sarifPath) {
            const sarif = toSarif(findings);
            await (await import('node:fs/promises')).writeFile(sarifPath, JSON.stringify(sarif, null, 2));
          }
        } else {
          process.stdout.write(renderAscii(findings, { style, icons, showRuleIds: showIds }) + '\n');
          if (sarifPath) {
            const sarif = toSarif(findings);
            await (await import('node:fs/promises')).writeFile(sarifPath, JSON.stringify(sarif, null, 2));
          }
          if (propose) {
            const { proposeFixesForFile, formatSuggestionsAsPatch } = await import('./fix/propose.js');
            const suggestions = await proposeFixesForFile(target);
            process.stdout.write('\nProposed changes (dry-run):\n');
            process.stdout.write(formatSuggestionsAsPatch(suggestions) + '\n');
          }
        }
      } else if (st.isDirectory()) {
        const res = await scanProject({ root: target });
        if (format === 'json') {
          process.stdout.write(JSON.stringify(res, null, 2) + '\n');
          if (sarifPath) {
            const sarif = toSarif(res.findings);
            await (await import('node:fs/promises')).writeFile(sarifPath, JSON.stringify(sarif, null, 2));
          }
        } else {
          process.stdout.write(renderAscii(res.findings, { style, icons, showRuleIds: showIds }) + '\n');
          if (sarifPath) {
            const sarif = toSarif(res.findings);
            await (await import('node:fs/promises')).writeFile(sarifPath, JSON.stringify(sarif, null, 2));
          }
          if (propose) {
            const { proposeFixesForFile, formatSuggestionsAsPatch } = await import('./fix/propose.js');
            // Propose for a small subset (top 5 files by findings)
            const top = new Map<string, number>();
            for (const f of res.findings) {
              if (!f.file) continue;
              top.set(f.file, (top.get(f.file) ?? 0) + 1);
            }
            const files = [...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f]) => f);
            let all: any[] = [];
            for (const f of files) all = all.concat(await proposeFixesForFile(f));
            process.stdout.write('\nProposed changes (dry-run):\n');
            process.stdout.write(formatSuggestionsAsPatch(all) + '\n');
          }
        }
      }
      return 0;
    } catch (err: any) {
      process.stderr.write(`Scan failed: ${String(err?.message ?? err)}\n`);
      return 1;
    }
  }

  // Default behavior: run quick scan (unicode bars + emoji icons)
  try {
    const { scanProject } = await import('./scan/engine.js');
    const { renderAscii } = await import('./report/ascii.js');
    const res = await scanProject({ root: process.cwd() });
    process.stdout.write(
      renderAscii(res.findings, { style: 'unicode', icons: 'emoji' }) + '\n'
    );
    return 0;
  } catch (err: any) {
    process.stderr.write(`Failed to run default quick scan: ${String(err?.message ?? err)}\n`);
    return 1;
  }
}
main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
