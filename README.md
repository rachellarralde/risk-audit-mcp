# Security Audit Skill

A portable security auditing skill that teaches AI coding assistants to become expert security auditors. Works with Claude Code, Codex CLI, Cursor, and any AI that can learn from prompts.

## What is This?

This is **not** a tool you install and run. It's a **skill** - a set of instructions and patterns that teach an AI assistant how to perform comprehensive security audits on any codebase.

Think of it like giving your AI assistant a security certification.

## Why a Skill Instead of a Tool?

| Traditional Tool | AI Skill |
|-----------------|----------|
| Runs regex patterns mechanically | Understands context and intent |
| Fixed rules, many false positives | Can reason about actual risk |
| Only finds exact pattern matches | Can identify novel vulnerabilities |
| Reports everything, you filter | Prioritizes what matters |
| Just flags issues | Explains why and how to fix |

An AI with security knowledge can:
- Follow data flow across functions and files
- Understand your specific architecture
- Explain attack scenarios in context
- Suggest fixes that match your codebase style
- Answer follow-up questions

## Quick Start

### Claude Code

Copy the skill file to your project or global config:

```bash
# Per-project (recommended)
mkdir -p .claude/skills
cp skills/security-audit.md .claude/skills/

# Or install globally
mkdir -p ~/.claude/skills
cp skills/security-audit.md ~/.claude/skills/
```

Then ask Claude Code to audit your code:
```
"Audit this codebase for security vulnerabilities"
"Check src/api for injection risks"
"Is this authentication implementation secure?"
```

### Codex CLI

Add the skill to your Codex instructions:

```bash
# Add to your AGENTS.md or instructions file
cat skills/security-audit.md >> AGENTS.md
```

Or reference it in your Codex config:
```json
{
  "instructions": "When asked about security, follow the methodology in skills/security-audit.md"
}
```

### Cursor / Other AI Editors

Add to your rules or system prompt:
1. Open settings/rules
2. Add the contents of `skills/security-audit.md`
3. Or reference it: "For security audits, use the methodology in skills/security-audit.md"

### Any AI Chat

Simply paste the skill content before your question:
```
[paste skills/security-audit.md]

Now audit this code for security issues:
[paste your code]
```

## What Gets Detected

### Critical (Fix Immediately)
- **SQL Injection** - Concatenated queries, f-strings in execute()
- **Command Injection** - exec() with user input, shell=True

### Medium Priority
- **XSS** - innerHTML, dangerouslySetInnerHTML, document.write
- **SSRF** - User-controlled URLs in fetch/axios/requests
- **Path Traversal** - User input in file operations
- **NoSQL Injection** - Variable objects in MongoDB queries

### Low Priority
- **Template Injection** - Variable templates
- **Debug Code** - alert(), console.log with sensitive data

### Beyond Pattern Matching

The AI can also review:
- Authentication & session handling
- Authorization & access controls
- Cryptography usage
- Dependency vulnerabilities
- Security headers & configuration
- Secrets management
- Error handling

## Files

```
skills/
├── security-audit.md        # Main skill - comprehensive methodology
└── vulnerability-patterns.md # Quick reference - patterns & regex
```

### security-audit.md
The complete skill teaching:
- Systematic audit methodology
- Taint analysis (tracking untrusted data)
- Vulnerability patterns with examples
- Language-specific guidance (JS/TS, Python, React)
- Fix recommendations
- Output format

### vulnerability-patterns.md
Quick reference containing:
- All detection patterns in table format
- Regex patterns for grep/ripgrep
- Severity classifications
- Taint source patterns

## Example Session

```
You: Audit this Express route for security issues

AI: I'll analyze this route using systematic security methodology...

## Security Audit: user-routes.js

### Critical Issues (1)

#### SQL Injection at line 24
**Code:**
```javascript
db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)
```
**Risk:** Attacker can inject SQL via the id parameter to extract or modify database contents.
**Fix:**
```javascript
db.query('SELECT * FROM users WHERE id = ?', [req.params.id])
```

### Medium Issues (2)

#### Path Traversal at line 31
...

### Recommendations
1. Use parameterized queries throughout
2. Add input validation middleware
3. Consider using an ORM like Prisma
```

## Extending the Skill

### Add Custom Patterns

Edit `skills/vulnerability-patterns.md` to add patterns specific to your stack:

```markdown
### Custom: Unsafe Deserialization

| ID | Language | Pattern | Description |
|----|----------|---------|-------------|
| CUSTOM001 | Python | `pickle\.loads?\s*\(` | Pickle deserialization |
```

### Add Framework-Specific Rules

Extend `skills/security-audit.md` with your framework's security considerations:

```markdown
## Next.js Specific

### Server Actions
- Validate all inputs in server actions
- Don't expose sensitive data in client components
- Use `headers()` and `cookies()` safely
```

## Philosophy

**Zero network calls** - Everything runs locally in your AI's context

**Teach, don't just flag** - The AI explains vulnerabilities, not just lists them

**Context-aware** - The AI understands your code, not just pattern matches

**Portable** - Works with any AI that can read markdown

**Extensible** - Add your own patterns and rules

## Contributing

Add patterns, improve explanations, support more languages:

1. Fork this repo
2. Edit files in `skills/`
3. Submit a PR

## License

MIT - Use freely, contribute back if you can.
