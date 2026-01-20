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

import type { HandlerOptions } from './types';
import { createErrorResponse, ErrorCodes } from './types';
import { toolSchemas, type ToolName } from './schemas';
import { getToolHandler, hasToolHandler } from './tools/registry';
import { sessionManager } from './session-manager';
import { TOOL_DEFINITIONS } from './tool-definitions';

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
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          createErrorResponse(
            code,
            message,
            details,
            sessionManager.getSessionId(),
            startTime,
          ),
          null,
          2,
        ),
      },
    ],
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
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
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
