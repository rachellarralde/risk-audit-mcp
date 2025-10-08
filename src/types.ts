export type Severity = 'critical' | 'medium' | 'low';

export interface Position {
  line: number; // 1-based
  column: number; // 1-based
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Rule {
  id: string;
  title: string;
  severity: Severity;
  language: 'js' | 'ts' | 'python' | 'any';
  description?: string;
  pattern: RegExp;
  fix?: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  severity: Severity;
  file?: string;
  range: Range;
  snippet: string;
  message: string;
  fix?: string;
}
