// Phase 1 MCP server skeleton using stdio transport.
// This file avoids top-level imports of the MCP SDK to keep build/tests green
// even if the SDK isn't installed yet. SDK is loaded dynamically when starting.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtinRules } from './rules/builtin.js';
import { loadYamlRules } from './rules/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getPkg() {
  const raw = readFileSync(join(__dirname, '..', 'package.json'), 'utf8');
  return JSON.parse(raw) as { name: string; version: string; description?: string };
}

// Start MCP server over stdio. Returns a promise that resolves when the server disconnects.
export async function startMcpServerStdio(): Promise<void> {
  const pkg = getPkg();

  // Dynamic import to prevent TS resolution issues when not installed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { Server }: any = await import('@modelcontextprotocol/sdk/server/index.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { StdioServerTransport }: any = await import(
    '@modelcontextprotocol/sdk/server/stdio.js'
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ListToolsRequestSchema, CallToolRequestSchema }: any = await import(
    '@modelcontextprotocol/sdk/types.js'
  );

  const server = new Server(
    { name: pkg.name, version: pkg.version },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // tools/list: advertise available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_version',
          description: 'Return server version information',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'list_rules',
          description: 'List built-in scanning rules',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'scan_file',
          description: 'Scan a single file path',
          inputSchema: {
            type: 'object',
            properties: { path: { type: 'string' } },
            required: ['path'],
            additionalProperties: false
          }
        },
        {
          name: 'scan_project',
          description: 'Scan a project directory',
          inputSchema: {
            type: 'object',
            properties: {
              root: { type: 'string' },
              include: { type: 'array', items: { type: 'string' } },
              exclude: { type: 'array', items: { type: 'string' } }
            },
            required: ['root'],
            additionalProperties: false
          }
        }
      ]
    };
  });

  // tools/call: handle invocations
  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    try {
      const name = req?.params?.name as string;
      switch (name) {
        case 'get_version': {
          const info = { name: pkg.name, version: pkg.version, description: pkg.description };
          return { content: [{ type: 'json', json: info }] };
        }
        case 'list_rules': {
          const yamlRules = await loadYamlRules().catch(() => []);
          return { content: [{ type: 'json', json: [...builtinRules, ...yamlRules] }] };
        }
        case 'scan_file': {
          const { scanFile } = await import('./scan/engine.js');
          const p = req?.params?.arguments?.path as string;
          const findings = await scanFile(p);
          return { content: [{ type: 'json', json: { findings } }] };
        }
        case 'scan_project': {
          const { scanProject } = await import('./scan/engine.js');
          const args = req?.params?.arguments ?? {};
          const res = await scanProject({ root: args.root, include: args.include, exclude: args.exclude });
          return { content: [{ type: 'json', json: res }] };
        }
        default: {
          return {
            isError: true,
            error: {
              code: 'tool_not_found',
              message: `Unknown tool: ${String(name)}`
            }
          };
        }
      }
    } catch (err) {
      return {
        isError: true,
        error: {
          code: 'internal_error',
          message: (err as Error)?.message ?? 'Unexpected error'
        }
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep process alive until stdin closes (typical MCP lifecycle)
  try {
    if (process.stdin && typeof process.stdin.resume === 'function') {
      process.stdin.resume();
    }
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      process.stdin?.once?.('end', done);
      process.stdin?.once?.('close', done);
    });
  } finally {
    // no-op: allow caller to exit
  }
}
