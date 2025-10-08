# How to Test (Phase 0)

This guide explains how to run and validate Phase 0 (bootstrap) of Vibe Check MCP.

## 1) Install dependencies

- Ensure Node.js >= 18 is installed
- From the repo root, install dev dependencies:
  - `npm install`

## 2) Build

- Compile TypeScript to `dist/`:
  - `npm run build`

## 3) Quick manual checks

- Help:
  - `node dist/index.js --help`
  - Expect usage text including `--help`, `--version`, `--check`.
- Version:
  - `node dist/index.js --version`
  - Expect the version printed from `package.json`.
- Health check:
  - `node dist/index.js --check`
  - Expect: `[ok] Vibe Check MCP skeleton is ready.`
- Default banner:
  - `node dist/index.js`
  - Expect: banner showing `Phase 0 Skeleton`.

## 4) Automated tests

- Run the test suite:
  - `npm test`
- The test script builds the project first, then runs Vitest.
- What tests cover:
  - `--version` matches package.json version
  - `--help` prints usage with expected options
  - `--check` prints a ready message and exits 0
  - Default run prints the Phase 0 banner

## Notes

- Phase 0 does not include MCP wiring or scanning yet. Those arrive in Phases 1–3.
- If you change CLI text/flags, update tests in `tests/cli.spec.ts` accordingly.
- If you use another test runner, adjust `package.json` scripts as needed.

---

# Install/Use Locally in Other Repos (Phase 5)

There are two easy ways to use vibe-check-mcp in other local repos without publishing.

## Option A — Global link (fastest during development)

In this repo (risk-audit):
- `npm install`
- `npm run build`
- `npm link`  (creates a global symlink for the `risk-audit` binary)

In your target project repo:
- `npm link risk-audit`

Now you can run:
- `risk-audit --mcp-stdio` (MCP server)
- `risk-audit --scan . --format ascii` (local CLI scan)

To remove the link later:
- In target project: `npm unlink risk-audit`
- Globally (optional): `npm unlink -g risk-audit`

## Option B — Pack a tarball and install

In this repo:
- `npm install`
- `npm run build`
- `npm pack`  (produces something like `vibe-check-mcp-0.1.0.tgz`)

In your target project repo:
- `npm install ../path/to/risk-audit-0.1.0.tgz`

Now you can run the binary directly from PATH:
- `risk-audit --mcp-stdio`
- `risk-audit --scan . --format json`

Note: `package.json` has `prepare`/`prepack` scripts to build automatically during install/pack.

## Claude Desktop integration (local)

Update `~/Library/Application Support/Claude/claude_desktop_config.json`:

{
  "mcpServers": {
    "risk-audit": {
      "command": "risk-audit",
      "args": ["--mcp-stdio"],
      "env": {}
    }
  }
}

If the binary is not on PATH, use Node + dist path instead:

{
  "mcpServers": {
    "risk-audit": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js", "--mcp-stdio"],
      "env": {}
    }
  }
}

## Codex CLI integration (local)

Add an MCP server entry in the Codex CLI config:

{
  "mcpServers": {
    "risk-audit": {
      "command": "risk-audit",
      "args": ["--mcp-stdio"]
    }
  }
}

Or point to Node + dist path as shown above.

## CLI usage recap
- Scan directory (ASCII): `risk-audit --scan . --format ascii`
- Scan directory (JSON):   `risk-audit --scan . --format json`
- Start MCP server:        `risk-audit --mcp-stdio`
- Help/Version:            `risk-audit --help | --version`

## Config recap (.vibecheckrc)
Example `.vibecheckrc.json` in your target repo root:

{
  "severityMin": "medium",
  "include": ["src/", "api/"],
  "exclude": ["dist/", "node_modules/"],
  "rules": { "disable": ["YAML001"], "enable": [] }
}

This affects both CLI `--scan <dir>` and MCP `scan_project`.
