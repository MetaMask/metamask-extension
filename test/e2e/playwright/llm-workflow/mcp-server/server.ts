#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import type {
  BuildInput,
  LaunchInput,
  CleanupInput,
  NavigateInput,
  WaitForNotificationInput,
  ListTestIdsInput,
  AccessibilitySnapshotInput,
  DescribeScreenInput,
  ScreenshotInput,
  ClickInput,
  TypeInput,
  WaitForInput,
  KnowledgeLastInput,
  KnowledgeSearchInput,
  KnowledgeSummarizeInput,
} from './types';

import { handleBuild } from './tools/build';
import { handleLaunch } from './tools/launch';
import { handleCleanup } from './tools/cleanup';
import { handleGetState } from './tools/state';
import { handleNavigate, handleWaitForNotification } from './tools/navigation';
import {
  handleListTestIds,
  handleAccessibilitySnapshot,
  handleDescribeScreen,
} from './tools/discovery-tools';
import { handleClick, handleType, handleWaitFor } from './tools/interaction';
import { handleScreenshot } from './tools/screenshot';
import {
  handleKnowledgeLast,
  handleKnowledgeSearch,
  handleKnowledgeSummarize,
} from './tools/knowledge';
import { sessionManager } from './session-manager';

const TOOL_DEFINITIONS = [
  {
    name: 'mm_build',
    description:
      'Build the MetaMask extension using yarn build:test. Call before mm_launch if extension is not built.',
    inputSchema: {
      type: 'object',
      properties: {
        buildType: {
          type: 'string',
          enum: ['build:test'],
          default: 'build:test',
        },
        force: {
          type: 'boolean',
          default: false,
          description: 'Force rebuild even if build exists',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_launch',
    description:
      'Launch MetaMask extension in a headed Chrome browser with Playwright. Returns session info and initial state.',
    inputSchema: {
      type: 'object',
      properties: {
        autoBuild: {
          type: 'boolean',
          default: true,
          description: 'Automatically build extension if not found',
        },
        stateMode: {
          type: 'string',
          enum: ['default', 'onboarding', 'custom'],
          default: 'default',
          description:
            'default: pre-onboarded wallet with 25 ETH. onboarding: fresh wallet. custom: use fixture.',
        },
        fixturePreset: {
          type: 'string',
          minLength: 1,
          description:
            'Name of preset fixture (e.g., withMultipleAccounts, withERC20Tokens)',
        },
        fixture: {
          type: 'object',
          description: 'Direct fixture object for stateMode=custom',
        },
        ports: {
          type: 'object',
          properties: {
            anvil: { type: 'integer', minimum: 1, maximum: 65535 },
            fixtureServer: { type: 'integer', minimum: 1, maximum: 65535 },
          },
          additionalProperties: false,
        },
        slowMo: {
          type: 'integer',
          minimum: 0,
          maximum: 10000,
          default: 0,
          description: 'Slow down actions (ms) for debugging',
        },
        extensionPath: {
          type: 'string',
          description: 'Custom path to extension directory',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_cleanup',
    description:
      'Stop the browser, Anvil, and all services. Always call when done.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_get_state',
    description:
      'Get current extension state including screen, URL, balance, network, and account address.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'mm_navigate',
    description: 'Navigate to a specific screen in the extension.',
    inputSchema: {
      type: 'object',
      properties: {
        screen: {
          type: 'string',
          enum: ['home', 'settings', 'notification', 'url'],
        },
        url: {
          type: 'string',
          minLength: 1,
          description: 'Required when screen is "url"',
        },
      },
      required: ['screen'],
      additionalProperties: false,
    },
  },
  {
    name: 'mm_wait_for_notification',
    description:
      'Wait for MetaMask notification popup to appear (e.g., after dapp interaction).',
    inputSchema: {
      type: 'object',
      properties: {
        timeoutMs: {
          type: 'integer',
          minimum: 1000,
          maximum: 60000,
          default: 15000,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_list_testids',
    description:
      'List all visible data-testid attributes on the current page. Use to discover available interaction targets.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 500,
          default: 150,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_accessibility_snapshot',
    description:
      'Get trimmed accessibility tree with deterministic refs (e1, e2, ...). Use refs with mm_click/mm_type.',
    inputSchema: {
      type: 'object',
      properties: {
        rootSelector: {
          type: 'string',
          minLength: 1,
          description: 'Optional CSS selector to scope the snapshot',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_describe_screen',
    description:
      'Get comprehensive screen state: extension state + testIds + accessibility snapshot. Optional screenshot.',
    inputSchema: {
      type: 'object',
      properties: {
        includeScreenshot: {
          type: 'boolean',
          default: false,
          description: 'Capture screenshot (opt-in)',
        },
        screenshotName: {
          type: 'string',
          minLength: 1,
          description: 'Name for screenshot file',
        },
        includeScreenshotBase64: {
          type: 'boolean',
          default: false,
          description: 'Include base64-encoded screenshot in response',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_screenshot',
    description: 'Take a screenshot and save to test-artifacts/screenshots/',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          description: 'Screenshot filename (without extension)',
        },
        fullPage: {
          type: 'boolean',
          default: true,
        },
        selector: {
          type: 'string',
          minLength: 1,
          description: 'Capture specific element only',
        },
        includeBase64: {
          type: 'boolean',
          default: false,
          description: 'Include base64 in response',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'mm_click',
    description:
      'Click an element. Specify exactly one of: a11yRef, testId, or selector.',
    inputSchema: {
      type: 'object',
      properties: {
        a11yRef: {
          type: 'string',
          pattern: '^e[0-9]+$',
          description: 'Accessibility ref from mm_accessibility_snapshot',
        },
        testId: {
          type: 'string',
          minLength: 1,
          description: 'data-testid value',
        },
        selector: {
          type: 'string',
          minLength: 1,
          description: 'CSS selector',
        },
        timeoutMs: {
          type: 'integer',
          minimum: 0,
          maximum: 60000,
          default: 30000,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_type',
    description:
      'Type text into an element. Specify exactly one of: a11yRef, testId, or selector.',
    inputSchema: {
      type: 'object',
      properties: {
        a11yRef: {
          type: 'string',
          pattern: '^e[0-9]+$',
        },
        testId: {
          type: 'string',
          minLength: 1,
        },
        selector: {
          type: 'string',
          minLength: 1,
        },
        text: {
          type: 'string',
          description: 'Text to type',
        },
        timeoutMs: {
          type: 'integer',
          minimum: 0,
          maximum: 60000,
          default: 30000,
        },
      },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'mm_wait_for',
    description:
      'Wait for an element to become visible. Specify exactly one of: a11yRef, testId, or selector.',
    inputSchema: {
      type: 'object',
      properties: {
        a11yRef: {
          type: 'string',
          pattern: '^e[0-9]+$',
        },
        testId: {
          type: 'string',
          minLength: 1,
        },
        selector: {
          type: 'string',
          minLength: 1,
        },
        timeoutMs: {
          type: 'integer',
          minimum: 100,
          maximum: 120000,
          default: 30000,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_knowledge_last',
    description:
      'Get the last N step records from the knowledge store for the current session.',
    inputSchema: {
      type: 'object',
      properties: {
        n: {
          type: 'integer',
          minimum: 1,
          maximum: 200,
          default: 20,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_knowledge_search',
    description:
      'Search step records by tool name, screen, testId, or accessibility names.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'mm_knowledge_summarize',
    description: 'Generate a recipe-like summary of steps taken in a session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session to summarize (defaults to current)',
        },
      },
      additionalProperties: false,
    },
  },
];

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

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    let response;

    switch (name) {
      case 'mm_build':
        response = await handleBuild(args as BuildInput);
        break;
      case 'mm_launch':
        response = await handleLaunch(args as LaunchInput);
        break;
      case 'mm_cleanup':
        response = await handleCleanup(args as CleanupInput);
        break;
      case 'mm_get_state':
        response = await handleGetState();
        break;
      case 'mm_navigate':
        response = await handleNavigate(args as NavigateInput);
        break;
      case 'mm_wait_for_notification':
        response = await handleWaitForNotification(
          args as WaitForNotificationInput,
        );
        break;
      case 'mm_list_testids':
        response = await handleListTestIds(args as ListTestIdsInput);
        break;
      case 'mm_accessibility_snapshot':
        response = await handleAccessibilitySnapshot(
          args as AccessibilitySnapshotInput,
        );
        break;
      case 'mm_describe_screen':
        response = await handleDescribeScreen(args as DescribeScreenInput);
        break;
      case 'mm_screenshot':
        response = await handleScreenshot(args as ScreenshotInput);
        break;
      case 'mm_click':
        response = await handleClick(args as ClickInput);
        break;
      case 'mm_type':
        response = await handleType(args as TypeInput);
        break;
      case 'mm_wait_for':
        response = await handleWaitFor(args as WaitForInput);
        break;
      case 'mm_knowledge_last':
        response = await handleKnowledgeLast(args as KnowledgeLastInput);
        break;
      case 'mm_knowledge_search':
        response = await handleKnowledgeSearch(args as KnowledgeSearchInput);
        break;
      case 'mm_knowledge_summarize':
        response = await handleKnowledgeSummarize(
          args as KnowledgeSummarizeInput,
        );
        break;
      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: false,
                error: {
                  code: 'MM_UNKNOWN_TOOL',
                  message: `Unknown tool: ${name}`,
                },
              }),
            },
          ],
        };
    }

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
