declare module '@modelcontextprotocol/sdk/server/index.js' {
  // Minimal type shims to allow compiling without installed SDK types
  export const Server: any;
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export const StdioServerTransport: any;
}

declare module '@modelcontextprotocol/sdk/types.js' {
  export const ListToolsRequestSchema: any;
  export const CallToolRequestSchema: any;
}

// Optional dependency used by the YAML rule loader
declare module 'js-yaml' {
  export function load(input: string): any;
}
