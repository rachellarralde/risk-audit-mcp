# Risk Audit MCP — Security Scanner

![Risk Audit MCP Logo](assets/logo.png)

Risk Audit is a Model Context Protocol (MCP) server and CLI that scans your project for common security issues (XSS, injections, SSRF, path traversal, etc.). It runs locally, works offline, and gives clear, grouped results with suggested fixes.

## What is it?
- A tool that looks for risky patterns in your code and explains how to improve them.
- Works both as a CLI you can run in any repo and as an MCP server that IDE/AI tools can call.

## Who is it for?
- Beginners who want simple, actionable guidance to improve security.
- Developers who want a fast local scan they can wire into their workflow or MCP-enabled tools.

## Why use it?
- Quick feedback on common pitfalls (XSS, injections, SSRF, path traversal).
- Clear severity groups and practical fix suggestions.
- Zero network calls; your code never leaves your machine.

## Requirements
- Node.js >= 18

## Scripts
- `npm run dev` — run the TypeScript entrypoint via tsx (no build).
- `npm run build` — compile TypeScript to `dist/` via `tsc`.
- `npm start` — run the compiled output (`node dist/index.js`).
- `npm test` — build then run tests with Vitest.
- `npm run mcp` — start the MCP server (stdio).
- `npm run scan` — quick scan (unicode bars + emoji headers).

## Quick Start (CLI)
- Default quick scan (unicode bars + emoji headers, rule IDs hidden):
  - `risk-audit` or `risk-audit --quick`
- Custom examples:
  - `risk-audit --scan . --format ascii --style unicode --icons emoji`
  - `risk-audit --scan src --format json` (for scripts/CI)
  - `risk-audit --scan . --format ascii --show-ids` (show rule IDs in ASCII)
  - `risk-audit --scan . --format ascii --sarif risk-audit.sarif.json` (export SARIF)
  - `risk-audit --scan . --format ascii --propose-fixes` (show dry‑run patch suggestions)

## Run MCP Server (Simple)
- After building, start the MCP server with a simple command:
  - `npm run mcp`
  - Or use the binary directly if installed/linked: `risk-audit --mcp-stdio`
  - Or via npx without global install: `npx risk-audit --mcp-stdio`

## Client Setup Snippets

### Claude Desktop
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

{
  "mcpServers": {
    "risk-audit": {
      "command": "risk-audit",
      "args": ["--mcp-stdio"],
      "env": {}
    }
  }
}

Notes:
- Ensure `risk-audit` is on your PATH. If not, use:
  - `"command": "node", "args": ["/absolute/path/to/dist/index.js", "--mcp-stdio"]`

### Codex CLI
Register the MCP server so Codex can launch it over stdio. Example configuration entry:

{
  "mcpServers": {
    "risk-audit": {
      "command": "risk-audit",
      "args": ["--mcp-stdio"]
    }
  }
}

Notes:
- You can also point to Node directly if needed:
  - `"command": "node", "args": ["/absolute/path/to/dist/index.js", "--mcp-stdio"]`
- The server stays active until the client closes stdin.

## Understanding The Output
- Three groups by priority (with emoji in headers only):
  - ⚠️ Critical (fix immediately)
  - 🔍 Medium Priority
  - ⓘ Low Priority
- Each group has a progress bar and a numbered list of findings.
- File paths and line ranges are colored green so they stand out.
- Rule IDs are hidden by default in ASCII (show with `--show-ids`). JSON always includes `ruleId`.

## Output Format
- ASCII progress bars (default): `|==========......| 10/16 (62%)`
- Unicode bars (optional): `[██████████░░░░░░] 10/16 (62%)` (use `--style unicode`)

## Configuration (.vibecheckrc)
Place a `.vibecheckrc` (YAML) or `.vibecheckrc.json` at the project root.

Example YAML:

severityMin: medium
include: ["src/", "api/"]
exclude: ["dist/", "node_modules/"]
rules:
  disable: ["YAML001"]
  enable: []

- severityMin: filter out findings below this severity
- include/exclude: path substrings to include or exclude when scanning projects
- rules.enable/disable: whitelist/blacklist rule IDs

CLI respects config in project root for `--scan <dir>`. MCP `scan_project` also loads config from the given root.

## Quick Defaults and Aliases
- Default behavior (no args) runs a quick scan of the current directory with unicode bars and emoji icons:
  - Equivalent to: `risk-audit --scan . --format ascii --style unicode --icons emoji`
- Shortcut flag:
  - `risk-audit --quick`
- NPM script alias (from this repo):
  - `npm run scan`

## Security & Privacy
- All scanning runs locally; no code is uploaded anywhere.
- YAML rules are loaded from your repo’s `rules/` folder, if present. Be careful when adding third‑party rules to avoid regexes that cause slow scans (we cap matches per rule/file).
- We never execute your code; we only read files.


