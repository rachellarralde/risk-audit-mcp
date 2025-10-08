import { describe, it, expect } from 'vitest';
import { toSarif } from '../src/report/sarif';

describe('SARIF export', () => {
  it('produces minimal valid SARIF structure', () => {
    const findings = [
      {
        id: 'x',
        ruleId: 'RULE1',
        severity: 'medium',
        file: 'src/a.ts',
        range: { start: { line: 1, column: 1 }, end: { line: 1, column: 5 } },
        snippet: 'test',
        message: 'A message'
      } as any
    ];
    const sarif = toSarif(findings);
    expect(sarif.version).toBe('2.1.0');
    expect(Array.isArray(sarif.runs)).toBe(true);
    expect(sarif.runs[0].results.length).toBe(1);
    expect(sarif.runs[0].results[0].ruleId).toBe('RULE1');
  });
});

