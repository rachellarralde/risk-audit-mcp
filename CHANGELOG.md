# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 — Skill-Based Architecture

**Complete rewrite from MCP to AI Skill**

- Transformed from npm MCP package to portable AI skill
- New `skills/security-audit.md` - comprehensive security auditing methodology
- New `skills/vulnerability-patterns.md` - quick reference patterns
- Works with Claude Code, Codex CLI, Cursor, and any AI assistant
- No dependencies, no installation required
- Just copy the skill files and start auditing

### Why the change?

AI assistants with security knowledge are more powerful than regex-based tools:
- They understand context and data flow
- They can reason about actual risk vs false positives
- They explain vulnerabilities and suggest contextual fixes
- They answer follow-up questions

---

## 0.1.0 — Initial MVP (MCP)
- MCP stdio server with `get_version`, `list_rules`, `scan_file`, `scan_project`
- Rule system with regex heuristics (JS/TS/Python) + YAML loader
- Directory scanning, ASCII report, JSON output
- Configuration file support
