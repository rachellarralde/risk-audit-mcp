# Risk Audit MCP — Security Scanner Server: Project Plan

A minimal, easy-to-run Model Context Protocol (MCP) server that scans a local project for common security issues (XSS, injections, SSRF, path traversal, etc.). Designed to work out-of-the-box with MCP-capable clients like Claude Code and Codex CLI.

## Goals
- Simple install and run (one command start).
- Useful default rules for JS/TS and Python projects.
- Fast heuristics first; AST-backed checks as follow-ups.
- Clear, actionable findings with file, range, snippet, and fix ideas.
- Standards-compliant MCP tools and resources for broad client compatibility.
 - Severity buckets in all outputs: Critical, Medium, Low (ASCII-only, no emojis).

## Non-Goals (MVP)
- Full SAST parity with mature scanners.
- Deep framework-specific taint tracking.
- Networked dependency audits (keep offline for MVP).

## Compatibility
- MCP-compliant server process (stdio transport).
- Works with Claude Desktop/Claude Code via `claude_desktop_config.json`.
- Works with Codex CLI via standard MCP server config (client supplies command/args).

## Architecture Overview (MVP)
- Runtime: Node.js (>=18) + TypeScript for portability and quick start.
- SDK: `@modelcontextprotocol/sdk` (TypeScript implementation).
- Surface:
  - Tools: `scan_project`, `scan_file`, `list_rules`, `get_version`.
  - Resources: One resource per finding (`finding:<id>`) + an aggregate (`findings:latest`).
- Engine:
  - Heuristic rules with safe regex/AST-lite where helpful.
  - Rule registry in `rules/*.yaml` (id, title, severity, language, pattern, message, fix).
  - Report format: `{ id, ruleId, severity, file, start, end, snippet, message, fix }`.

## MCP Surface
- Tool `scan_project`
  - Params: `root: string`, `languages?: string[]`, `paths?: string[]`, `exclude?: string[]`.
  - Returns: `findings[]` summary + `resourceUris` for detailed results.
- Tool `scan_file`
  - Params: `path: string`, `language?: string`.
  - Returns: `findings[]` for file.
- Tool `list_rules`
  - Returns: `rules[]` with ids, titles, severities, languages.
- Tool `get_version`
  - Returns: version string and build info.
- Resources
  - `finding:<id>`: detailed finding (full context + fix ideas).
  - `findings:latest`: latest scan batch overview.

## Output Format (Severity & ASCII UI)
- Severity buckets
  - Critical — fix immediately
  - Medium Priority
  - Low Priority
- No emojis anywhere; ASCII-only indicators.
- ASCII severity icons
  - Critical: `[!!]`
  - Medium:  `[!] `
  - Low:     `[-] `
- Progress bars
  - Overall and per-severity bars: `[##########------] 10/16 (62%)`
  - Bar width fixed (e.g., 16 or 20 chars) for consistent rendering.
- Grouped, readable report
  - Header: overall summary + overall progress bar.
  - Sections per severity (Critical, Medium, Low) with counts and bars.
  - Within each section: one-line summary rows, then optional detail lines.
  - Example (CLI):
    - `[!!] XSS in src/app.ts:42-47 — innerHTML from user input`
    - `     file: src/app.ts  range: 42:5-47:12`
    - `     fix: use textContent or sanitize before assign`
  - JSON mode remains available for programmatic use.

## Phases & TODOs

### Phase 0 — Repo Bootstrap
- [x] Initialize Node + TypeScript project (`package.json`, `tsconfig.json`).
- [x] Add basic scripts: `dev`, `build`, `start`.
- [x] Add `src/index.ts` with MCP server skeleton.
- [x] Set up lint/format (eslint/prettier) minimal.
- [x] Add `README.md` with quick start.

### Phase 1 — MCP Server Skeleton
- [x] Wire up `@modelcontextprotocol/sdk` stdio transport.
- [x] Implement tool registration and request handling.
- [x] Implement `get_version` and `list_rules` stubs.
- [x] Return structured errors with helpful messages.

### Phase 2 — Rule System & Core Heuristics (MVP)
- [x] Define `Finding` and `Rule` types, severities (low/med/high/critical).
- [x] Add rule loader (`rules/*.yaml`) and validation (dynamic import with safe fallback).
- [x] JS/TS heuristics:
  - [x] XSS: `innerHTML`, `dangerouslySetInnerHTML`.
  - [x] SQLi: string-concat queries `db.query("..." + userInput)`.
  - [x] NoSQLi: unvalidated objects in Mongo queries.
  - [x] Cmd injection: `child_process.exec` with user-controlled input.
  - [x] Path traversal: `fs.*` with tainted path joins.
  - [x] SSRF: `fetch/axios/...` with variable URL.
- [x] Python heuristics:
  - [x] SQLi: `.execute(f"...{user}...")`, `%`, `format()` (basic)
  - [x] Cmd injection: `os.system`/`subprocess.*` with `shell=True` or variable input.
  - [x] Path traversal: `open()` with variable path (basic).
  - [x] Basic XSS hints in template render calls (heuristic).

### Phase 3 — Scanning Engine & Reporting
- [x] Directory walker with language detection (extensions, default excludes).
- [x] File-level scan with rule application and match ranges.
- [x] Collect snippets around ranges for context.
- [x] De-dupe overlapping findings; stable `findingId` generation.
- [x] Bucketize findings: Critical, Medium, Low.
- [x] Render ASCII-only grouped report with severity icons and progress bars.
- [ ] Emit MCP resources per finding + aggregate resource. (defer minimal resource wiring)
- [x] Optional JSON output to stdout for CLI use.

### Phase 4 — UX & Docs
- [x] Helpful messages with example fixes and safer APIs.
- [x] README: install, run, integrate with Claude & Codex CLI.
- [x] Map severities to colorized console output (ASCII-safe; no emojis).
- [x] Config file support (`.vibecheckrc`): include/exclude, rules, severity thresholds.
- [x] Document ASCII output format, icons, and progress bars with examples.

### Phase 5 — Packaging & Distribution
- [x] Add executable `bin/vibe-check-mcp` (via package `bin` field -> `dist/index.js`).
- [x] Single-command start: local usage via `npm link` or `npm pack` + install. (Publish optional.)
- [x] Versioning and changelog (`CHANGELOG.md`).

### Phase 6 — Nice-to-Have Enhancements
- [x] Quick-fix suggestions (dry-run patch proposals for common patterns).
- [ ] AST-backed checks for noisy rules (optional; can integrate acorn later).
- [x] Simple taint propagation within a file (annotate messages when tainted vars hit sinks).
- [x] SARIF export for CI integrations.

## Deliverables by Phase (Acceptance)
- Phase 1: Server starts, answers `get_version`, `list_rules` with example rule.
- Phase 2: Detects at least 6 classes of issues across JS/TS and Python with sample repos.
- Phase 3: Returns findings with accurate ranges, grouped by Critical/Medium/Low, ASCII-only icons and progress bars (and JSON mode).
- Phase 4: Usable README and simple config, good defaults.

## Quick Start (target experience once implemented)
- Requirements: Node.js >= 18.
- Install and run locally
  - `npm i` then `npm run dev` to start MCP server (stdio).
  - Or `npm run build` then `npm start`.
- Claude Desktop integration (example)
  - Create or edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
    {
      "mcpServers": {
        "vibe-check-mcp": {
          "command": "node",
          "args": ["/absolute/path/to/dist/index.js"],
          "env": {}
        }
      }
    }
- Codex CLI integration (example)
  - Configure an MCP server entry that runs `node dist/index.js` (stdio).
  - Ensure the process stays alive; Codex CLI will connect via stdio MCP.
  - See Codex CLI docs for adding a local MCP server command.

## Rule Coverage (Initial Set)
- XSS: client-side DOM sinks; server responses with raw HTML.
- SQL Injection: string-built queries in common DB clients.
- NoSQL Injection: unsanitized query objects in Mongo-like APIs.
- Command Injection: shell execution with user input.
- Path Traversal: filesystem access with tainted paths.
- SSRF: outbound requests with untrusted URLs.

## Heuristics & Noise Control
- Prefer precise literals over broad regex; add allowlists for common safe wrappers.
- Use small AST parses where string concat detection is too noisy.
- Provide suppression comments pattern: `// vibecheck:ignore <ruleId>`.

## Testing Strategy
- Unit tests for rule matchers with code snippets.
- Fixture projects (good/bad) for end-to-end scans.
- Golden files for deterministic finding IDs and messages.

## Repo Layout (Proposed)
- `src/index.ts` — MCP server entrypoint.
- `src/mcp.ts` — tool/resource registration.
- `src/scan/` — scanning engine, walkers, matchers.
- `src/rules/` — loader, schema, built-in rules.
- `rules/*.yaml` — rule definitions (human-editable).
- `scripts/` — dev/build helpers.
- `bin/risk-audit` — CLI shim.

## Open Questions
- Which frameworks to prioritize for tailored messages (Express, Next.js, Flask, Django)?
- Should we ship a tiny dependency DB or keep dependency scanning out entirely for MVP?
- Preferred config format beyond YAML (JSON/TOML)?

## Stretch Goals
- Taint tracking across function calls within a file.
- Language: add Go and PHP basic heuristics.
- Editor integrations and SARIF GitHub Advanced Security compatibility.

## Risks & Mitigations
- False positives: start conservative; document suppressions; iterate on rules.
- Performance on large repos: stream scanning, parallel workers, ignore build dirs.
- Client variability: keep to MCP basics; avoid non-standard features.

---

When you’re ready, I can scaffold Phase 0–1 so you can start the server and exercise the `list_rules`/`get_version` tools from Claude or Codex.
