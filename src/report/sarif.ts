import type { Finding } from '../types.js';

export function toSarif(findings: Finding[], opts?: { toolName?: string; version?: string }) {
  const toolName = opts?.toolName ?? 'risk-audit';
  return {
    version: '2.1.0',
    $schema: 'https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0-rtm.5.json',
    runs: [
      {
        tool: {
          driver: {
            name: toolName,
            informationUri: 'https://github.com/',
            rules: []
          }
        },
        results: findings.map((f) => ({
          ruleId: f.ruleId,
          level: f.severity === 'critical' ? 'error' : f.severity === 'medium' ? 'warning' : 'note',
          message: { text: `${f.message}${f.fix ? `\nFix: ${f.fix}` : ''}` },
          locations: f.file
            ? [
                {
                  physicalLocation: {
                    artifactLocation: { uri: f.file },
                    region: {
                      startLine: f.range.start.line,
                      startColumn: f.range.start.column,
                      endLine: f.range.end.line,
                      endColumn: f.range.end.column
                    }
                  }
                }
              ]
            : []
        }))
      }
    ]
  };
}

