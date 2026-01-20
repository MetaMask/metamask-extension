#!/usr/bin/env node
/* eslint-disable import/extensions */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
/* eslint-enable import/extensions */
import type { ZodError, ZodIssue } from 'zod';

import type { HandlerOptions, McpResponse } from './types';
import { createErrorResponse, ErrorCodes } from './types';
import { toolSchemas, type ToolName } from './schemas';
import { getToolHandler, hasToolHandler } from './tools/registry';
import { sessionManager } from './session-manager';
import { TOOL_DEFINITIONS } from './tool-definitions';

function formatResponseAsText(response: McpResponse<unknown>): string {
  if (!response.ok) {
    return `Error [${String(response.error?.code)}]: ${String(response.error?.message)}`;
  }

  const { result } = response;
  if (typeof result === 'object' && result !== null) {
    const r = result as Record<string, unknown>;
    if ('clicked' in r) {
      return `Clicked: ${String(r.target)}`;
    }
    if ('typed' in r) {
      return `Typed ${String(r.textLength)} chars into ${String(r.target)}`;
    }
    if ('found' in r && 'target' in r) {
      return `Found: ${String(r.target)}`;
    }
    if ('items' in r && Array.isArray(r.items)) {
      return `Found ${String(r.items.length)} items`;
    }
    if ('nodes' in r && Array.isArray(r.nodes)) {
      return `Found ${String(r.nodes.length)} a11y nodes`;
    }
    if ('state' in r && typeof r.state === 'object' && r.state !== null) {
      const state = r.state as Record<string, unknown>;
      return `Screen: ${String(state.currentScreen ?? 'unknown')}`;
    }
    if ('sessionId' in r && typeof r.sessionId === 'string') {
      return `Session started: ${r.sessionId}`;
    }
    if ('steps' in r && 'summary' in r) {
      const summary = r.summary as Record<string, unknown>;
      return `Batch: ${String(summary.succeeded)}/${String(summary.total)} succeeded`;
    }
    if ('cleanedUp' in r) {
      return 'Session cleaned up';
    }
    if ('buildType' in r) {
      return `Build completed: ${String(r.buildType)}`;
    }
  }

  return `OK: ${JSON.stringify(result).substring(0, 100)}`;
}

function formatZodError(error: ZodError<unknown>): string {
  return (error.issues as ZodIssue[])
    .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
}

function validateInput<Name extends ToolName>(
  toolName: Name,
  args: unknown,
): { success: true; data: unknown } | { success: false; error: string } {
  const schema = toolSchemas[toolName];
  if (!schema) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  const result = schema.safeParse(args ?? {});
  if (!result.success) {
    return { success: false, error: formatZodError(result.error) };
  }

  return { success: true, data: result.data };
}

function createToolErrorResponse(
  code: (typeof ErrorCodes)[keyof typeof ErrorCodes],
  message: string,
  details: Record<string, unknown> | undefined,
  startTime: number,
) {
  const response = createErrorResponse(
    code,
    message,
    details,
    sessionManager.getSessionId(),
    startTime,
  );

  return {
    structuredContent: response,
    content: [
      {
        type: 'text' as const,
        text: formatResponseAsText(response),
      },
    ],
    isError: true,
  };
}

async function main() {
  const server = new Server(
    {
      name: 'metamask-visual-testing',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();
    const signal = extra?.signal;

    if (!hasToolHandler(name)) {
      return createToolErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        `Unknown tool: ${name}`,
        undefined,
        startTime,
      );
    }

    const validation = validateInput(name as ToolName, args);
    if (!validation.success) {
      const errorMessage =
        'error' in validation ? validation.error : 'Unknown validation error';
      return createToolErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        `Invalid input: ${errorMessage}`,
        { providedArgs: args },
        startTime,
      );
    }

    const validatedArgs = validation.data;
    const options: HandlerOptions = { signal };

    const handler = getToolHandler(name);
    if (!handler) {
      return createToolErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        `Unknown tool: ${name}`,
        undefined,
        startTime,
      );
    }

    const response = await handler(validatedArgs, options);

    return {
      structuredContent: response,
      content: [
        {
          type: 'text' as const,
          text: formatResponseAsText(response),
        },
      ],
      isError: !response.ok,
    };
  });

  process.on('SIGINT', async () => {
    console.error('Received SIGINT, cleaning up...');
    await sessionManager.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, cleaning up...');
    await sessionManager.cleanup();
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MetaMask MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
