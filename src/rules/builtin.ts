import type { Rule } from '../types.js';

export const builtinRules: Rule[] = [
  {
    id: 'VBC001',
    title: 'Avoid innerHTML with untrusted input',
    severity: 'medium',
    language: 'js',
    description:
      'Setting innerHTML directly can allow XSS. Prefer textContent or sanitize input before assignment.',
    // Matches assignments to innerHTML/outerHTML that are not simple string literals
    pattern: /\b(?:innerHTML|outerHTML)\s*=\s*(?!['"]).+/i,
    fix: 'Use textContent or sanitize the HTML (e.g., DOMPurify) before assigning.'
  },
  {
    id: 'VBC250',
    title: 'child_process.exec with concatenated command',
    severity: 'critical',
    language: 'ts',
    description: 'Avoid string-concatenated shell commands; prefer execFile/spawn with args array.',
    pattern: /\b(?:child_process\.)?exec\s*\(\s*[^\)]*\+[^\)]*\)/i
  },
  {
    id: 'VBC260',
    title: 'fs.* called with variable path',
    severity: 'medium',
    language: 'ts',
    description: 'Potential path traversal when using non-literal paths; validate and normalize.',
    pattern: /\bfs\.(?:readFile|readFileSync|writeFile|createReadStream|unlink|existsSync|mkdir|rmdir)\s*\(\s*(?!['"])./i
  },
  {
    id: 'VBC450',
    title: 'Mongo query with variable object',
    severity: 'medium',
    language: 'ts',
    description: 'Potential NoSQL injection when passing non-literal objects to query methods.',
    pattern: /\.(?:find|findOne|updateOne|updateMany|deleteMany|aggregate)\s*\(\s*(?!\{|\[|['"])./i
  },
  {
    id: 'VBC100',
    title: 'String concatenated SQL query',
    severity: 'critical',
    language: 'ts',
    description: 'Use parameterized queries to avoid SQL injection.',
    // Looks for .query( ... + ... ) or sql strings with concatenation
    pattern: /\.query\s*\(\s*[^\)]*\+[^\)]*\)/i,
    fix: 'Use placeholders and parameter arrays/objects in your DB client.'
  },
  {
    id: 'VBC200',
    title: 'Command execution with variable input',
    severity: 'critical',
    language: 'python',
    description: 'Avoid shelling out with user-controlled strings; prefer exec with arg arrays or safe APIs.',
    // os.system("..." + var) or variable passed directly
    pattern: /\bos\.system\s*\(\s*[^\)]*(?:\+|[^'"\)]\w)/i,
    fix: 'Use subprocess with args list and avoid shell=True; validate/escape inputs.'
  },
  {
    id: 'VBC201',
    title: 'subprocess with shell=True',
    severity: 'critical',
    language: 'python',
    description: 'shell=True can enable command injection when arguments include user input.',
    pattern: /\bsubprocess\.(?:run|Popen|call|check_output)\s*\([^\)]*shell\s*=\s*True/i,
    fix: 'Avoid shell=True; pass an argument list and validate inputs.'
  },
  {
    id: 'VBC002',
    title: 'dangerouslySetInnerHTML usage',
    severity: 'medium',
    language: 'js',
    description: 'dangerouslySetInnerHTML can expose XSS if content is not sanitized.',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/i,
    fix: 'Sanitize HTML before use or avoid dangerouslySetInnerHTML if possible.'
  },
  {
    id: 'VBC150',
    title: 'fetch/axios with variable URL',
    severity: 'medium',
    language: 'ts',
    description: 'Potential SSRF if URL is user-controlled. Validate and restrict destinations.',
    pattern: /\b(?:fetch|axios\.(?:get|post|put|delete|request))\s*\(\s*(?!['"])./i,
    fix: 'Validate and whitelist outbound hosts; avoid passing raw user input as URLs.'
  },
  {
    id: 'VBC300',
    title: 'open() with variable path',
    severity: 'low',
    language: 'python',
    description: 'Potential path traversal when opening user-controlled paths.',
    pattern: /\bopen\s*\(\s*(?!['"])./i,
    fix: 'Resolve to a known base directory and validate allowed filenames.'
  },
  {
    id: 'VBP110',
    title: 'cursor.execute with f-string/format/%',
    severity: 'critical',
    language: 'python',
    description: 'Use parameterized queries instead of string formatting to avoid SQL injection.',
    pattern: /\.execute\s*\(\s*(?:f['"][^'"]*\{[^}]+\}[^'"]*['"]|['"][^'"]*\{[^}]+\}[^'"]*['"]\s*\.\s*format\s*\(|['"][^'"]+['"]\s*%)/i,
    fix: 'Use placeholders and DB-API parameter binding (e.g., cursor.execute(sql, params)).'
  },
  {
    id: 'VBP310',
    title: 'render_template_string with variable input',
    severity: 'low',
    language: 'python',
    description: 'Rendering template strings with variables can enable XSS if content is unescaped.',
    pattern: /\brender_template_string\s*\(\s*(?!['"])./i,
    fix: 'Prefer render_template with templates that autoescape; sanitize user content.'
  }
];
