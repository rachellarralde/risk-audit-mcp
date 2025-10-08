import { describe, it, expect } from 'vitest';
import { builtinRules } from '../src/rules/builtin';
import { scanText } from '../src/scan/matchers';

describe('Rule matchers', () => {
  it('detects innerHTML assignment (JS/TS)', () => {
    const code = `
      const div = document.createElement('div');
      const unsafe = userInput;
      div.innerHTML = unsafe;
    `;
    const findings = scanText(code, builtinRules, { language: 'js', file: 'ex.js' });
    const hit = findings.find((f) => f.ruleId === 'VBC001');
    expect(hit, 'expected VBC001 to be found').toBeTruthy();
  });

  it('detects SQL string concatenation (TS)', () => {
    const code = `
      const user = req.query.user;
      db.query("SELECT * FROM users WHERE name='" + user + "'");
    `;
    const findings = scanText(code, builtinRules, { language: 'ts', file: 'db.ts' });
    const hit = findings.find((f) => f.ruleId === 'VBC100');
    expect(hit, 'expected VBC100 to be found').toBeTruthy();
  });

  it('detects subprocess shell=True (Python)', () => {
    const code = `
import subprocess
cmd = f"ls -la {path}"
subprocess.run(cmd, shell=True)
`;
    const findings = scanText(code, builtinRules, { language: 'python', file: 'cmd.py' });
    const hit = findings.find((f) => f.ruleId === 'VBC201');
    expect(hit, 'expected VBC201 to be found').toBeTruthy();
  });

  it('detects child_process.exec concatenation (TS)', () => {
    const code = `
      import { exec } from 'child_process';
      const arg = userInput;
      exec("ls -la " + arg);
    `;
    const findings = scanText(code, builtinRules, { language: 'ts', file: 'exec.ts' });
    const hit = findings.find((f) => f.ruleId === 'VBC250');
    expect(hit, 'expected VBC250 to be found').toBeTruthy();
  });

  it('detects fs.* with variable path (TS)', () => {
    const code = `
      import * as fs from 'fs';
      const p = req.query.path;
      fs.readFileSync(p);
    `;
    const findings = scanText(code, builtinRules, { language: 'ts', file: 'fs.ts' });
    const hit = findings.find((f) => f.ruleId === 'VBC260');
    expect(hit, 'expected VBC260 to be found').toBeTruthy();
  });

  it('detects Mongo query with variable object (TS)', () => {
    const code = `
      const q = req.body;
      db.users.find(q);
    `;
    const findings = scanText(code, builtinRules, { language: 'ts', file: 'mongo.ts' });
    const hit = findings.find((f) => f.ruleId === 'VBC450');
    expect(hit, 'expected VBC450 to be found').toBeTruthy();
  });

  it('detects Python .execute with formatting (SQLi)', () => {
    const code = `
cursor.execute("SELECT * FROM users WHERE name='%s'" % name)
`;
    const findings = scanText(code, builtinRules, { language: 'python', file: 'sql.py' });
    const hit = findings.find((f) => f.ruleId === 'VBP110');
    expect(hit, 'expected VBP110 to be found').toBeTruthy();
  });

  it('detects render_template_string (XSS hint)', () => {
    const code = `
from flask import render_template_string
render_template_string(template, user=user)
`;
    const findings = scanText(code, builtinRules, { language: 'python', file: 'tmpl.py' });
    const hit = findings.find((f) => f.ruleId === 'VBP310');
    expect(hit, 'expected VBP310 to be found').toBeTruthy();
  });
});
