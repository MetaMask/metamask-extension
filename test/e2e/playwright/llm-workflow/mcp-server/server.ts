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
  KnowledgeSessionsInput,
  SeedContractInput,
  SeedContractsInput,
  GetContractAddressInput,
  ListDeployedContractsInput,
  HandlerOptions,
} from './types';
import { createErrorResponse, ErrorCodes } from './types';
import { toolSchemas, type ToolName } from './schemas';

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
  handleKnowledgeSessions,
} from './tools/knowledge';
import {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './tools/seeding';
import { sessionManager } from './session-manager';

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
        goal: {
          type: 'string',
          description: 'Goal or task description for this session',
        },
        flowTags: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Flow tags for categorization (e.g., send, swap, connect, sign)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Free-form tags for ad-hoc filtering',
        },
        seedContracts: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'hst',
              'nfts',
              'erc1155',
              'piggybank',
              'failing',
              'multisig',
              'entrypoint',
              'simpleAccountFactory',
              'verifyingPaymaster',
            ],
          },
          description:
            'Smart contracts to deploy on launch (before extension loads)',
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
          default: 15000,
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
          default: 15000,
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
          default: 15000,
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
        scope: {
          oneOf: [
            { type: 'string', enum: ['current', 'all'] },
            {
              type: 'object',
              properties: { sessionId: { type: 'string', minLength: 4 } },
              required: ['sessionId'],
              additionalProperties: false,
            },
          ],
          default: 'current',
          description:
            'current: only active session, all: all sessions, {sessionId}: specific session',
        },
        filters: {
          type: 'object',
          properties: {
            flowTag: { type: 'string', minLength: 1 },
            tag: { type: 'string', minLength: 1 },
            screen: { type: 'string', minLength: 1 },
            sinceHours: { type: 'integer', minimum: 1, maximum: 720 },
            gitBranch: { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_knowledge_search',
    description:
      'Search step records by tool name, screen, testId, or accessibility names. Default searches all sessions.',
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
        scope: {
          oneOf: [
            { type: 'string', enum: ['current', 'all'] },
            {
              type: 'object',
              properties: { sessionId: { type: 'string', minLength: 4 } },
              required: ['sessionId'],
              additionalProperties: false,
            },
          ],
          default: 'all',
          description:
            'current: only active session, all: all sessions (default), {sessionId}: specific session',
        },
        filters: {
          type: 'object',
          properties: {
            flowTag: { type: 'string', minLength: 1 },
            tag: { type: 'string', minLength: 1 },
            screen: { type: 'string', minLength: 1 },
            sinceHours: { type: 'integer', minimum: 1, maximum: 720 },
            gitBranch: { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
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
          description: 'Deprecated: use scope. Session to summarize.',
        },
        scope: {
          oneOf: [
            { type: 'string', enum: ['current'] },
            {
              type: 'object',
              properties: { sessionId: { type: 'string', minLength: 4 } },
              required: ['sessionId'],
              additionalProperties: false,
            },
          ],
          default: 'current',
          description:
            'current: active session, {sessionId}: specific session. Cannot use "all".',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_knowledge_sessions',
    description:
      'List recent sessions with metadata for cross-session knowledge retrieval.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          default: 10,
        },
        filters: {
          type: 'object',
          properties: {
            flowTag: { type: 'string', minLength: 1 },
            tag: { type: 'string', minLength: 1 },
            sinceHours: { type: 'integer', minimum: 1, maximum: 720 },
            gitBranch: { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_seed_contract',
    description:
      'Deploy a smart contract to the local Anvil node. Available: hst (ERC20 TST token), nfts (ERC721), erc1155, piggybank, failing (reverts), multisig, entrypoint (ERC-4337), simpleAccountFactory, verifyingPaymaster.',
    inputSchema: {
      type: 'object',
      properties: {
        contractName: {
          type: 'string',
          enum: [
            'hst',
            'nfts',
            'erc1155',
            'piggybank',
            'failing',
            'multisig',
            'entrypoint',
            'simpleAccountFactory',
            'verifyingPaymaster',
          ],
          description: 'Smart contract to deploy',
        },
        hardfork: {
          type: 'string',
          enum: [
            'frontier',
            'homestead',
            'dao',
            'tangerine',
            'spuriousDragon',
            'byzantium',
            'constantinople',
            'petersburg',
            'istanbul',
            'muirGlacier',
            'berlin',
            'london',
            'arrowGlacier',
            'grayGlacier',
            'paris',
            'shanghai',
            'prague',
          ],
          default: 'prague',
          description: 'EVM hardfork to use for deployment (default: prague)',
        },
        deployerOptions: {
          type: 'object',
          properties: {
            fromAddress: {
              type: 'string',
              description: 'Deploy from impersonated address',
            },
            fromPrivateKey: {
              type: 'string',
              description:
                'Deploy from private key (account seeded with 1 ETH)',
            },
          },
          additionalProperties: false,
        },
      },
      required: ['contractName'],
      additionalProperties: false,
    },
  },
  {
    name: 'mm_seed_contracts',
    description: 'Deploy multiple smart contracts in sequence.',
    inputSchema: {
      type: 'object',
      properties: {
        contracts: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'hst',
              'nfts',
              'erc1155',
              'piggybank',
              'failing',
              'multisig',
              'entrypoint',
              'simpleAccountFactory',
              'verifyingPaymaster',
            ],
          },
          minItems: 1,
          maxItems: 9,
          description: 'List of contracts to deploy',
        },
        hardfork: {
          type: 'string',
          enum: [
            'frontier',
            'homestead',
            'dao',
            'tangerine',
            'spuriousDragon',
            'byzantium',
            'constantinople',
            'petersburg',
            'istanbul',
            'muirGlacier',
            'berlin',
            'london',
            'arrowGlacier',
            'grayGlacier',
            'paris',
            'shanghai',
            'prague',
          ],
          default: 'prague',
          description: 'EVM hardfork to use for deployment (default: prague)',
        },
      },
      required: ['contracts'],
      additionalProperties: false,
    },
  },
  {
    name: 'mm_get_contract_address',
    description: 'Get the deployed address of a smart contract.',
    inputSchema: {
      type: 'object',
      properties: {
        contractName: {
          type: 'string',
          enum: [
            'hst',
            'nfts',
            'erc1155',
            'piggybank',
            'failing',
            'multisig',
            'entrypoint',
            'simpleAccountFactory',
            'verifyingPaymaster',
          ],
          description: 'Contract name to look up',
        },
      },
      required: ['contractName'],
      additionalProperties: false,
    },
  },
  {
    name: 'mm_list_contracts',
    description: 'List all smart contracts deployed in this session.',
    inputSchema: {
      type: 'object',
      properties: {},
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

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();
    const signal = extra?.signal;

    if (!(name in toolSchemas)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              createErrorResponse(
                ErrorCodes.MM_INVALID_INPUT,
                `Unknown tool: ${name}`,
                undefined,
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

    const validation = validateInput(name as ToolName, args);
    if (!validation.success) {
      const errorMessage =
        'error' in validation ? validation.error : 'Unknown validation error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              createErrorResponse(
                ErrorCodes.MM_INVALID_INPUT,
                `Invalid input: ${errorMessage}`,
                { providedArgs: args },
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

    const validatedArgs = validation.data;
    const options: HandlerOptions = { signal };
    let response;

    switch (name) {
      case 'mm_build':
        response = await handleBuild(validatedArgs as BuildInput, options);
        break;
      case 'mm_launch':
        response = await handleLaunch(validatedArgs as LaunchInput, options);
        break;
      case 'mm_cleanup':
        response = await handleCleanup(validatedArgs as CleanupInput, options);
        break;
      case 'mm_get_state':
        response = await handleGetState(options);
        break;
      case 'mm_navigate':
        response = await handleNavigate(
          validatedArgs as NavigateInput,
          options,
        );
        break;
      case 'mm_wait_for_notification':
        response = await handleWaitForNotification(
          validatedArgs as WaitForNotificationInput,
          options,
        );
        break;
      case 'mm_list_testids':
        response = await handleListTestIds(
          validatedArgs as ListTestIdsInput,
          options,
        );
        break;
      case 'mm_accessibility_snapshot':
        response = await handleAccessibilitySnapshot(
          validatedArgs as AccessibilitySnapshotInput,
          options,
        );
        break;
      case 'mm_describe_screen':
        response = await handleDescribeScreen(
          validatedArgs as DescribeScreenInput,
          options,
        );
        break;
      case 'mm_screenshot':
        response = await handleScreenshot(
          validatedArgs as ScreenshotInput,
          options,
        );
        break;
      case 'mm_click':
        response = await handleClick(validatedArgs as ClickInput, options);
        break;
      case 'mm_type':
        response = await handleType(validatedArgs as TypeInput, options);
        break;
      case 'mm_wait_for':
        response = await handleWaitFor(validatedArgs as WaitForInput, options);
        break;
      case 'mm_knowledge_last':
        response = await handleKnowledgeLast(
          validatedArgs as KnowledgeLastInput,
          options,
        );
        break;
      case 'mm_knowledge_search':
        response = await handleKnowledgeSearch(
          validatedArgs as KnowledgeSearchInput,
          options,
        );
        break;
      case 'mm_knowledge_summarize':
        response = await handleKnowledgeSummarize(
          validatedArgs as KnowledgeSummarizeInput,
          options,
        );
        break;
      case 'mm_knowledge_sessions':
        response = await handleKnowledgeSessions(
          validatedArgs as KnowledgeSessionsInput,
          options,
        );
        break;
      case 'mm_seed_contract':
        response = await handleSeedContract(
          validatedArgs as SeedContractInput,
          options,
        );
        break;
      case 'mm_seed_contracts':
        response = await handleSeedContracts(
          validatedArgs as SeedContractsInput,
          options,
        );
        break;
      case 'mm_get_contract_address':
        response = await handleGetContractAddress(
          validatedArgs as GetContractAddressInput,
          options,
        );
        break;
      case 'mm_list_contracts':
        response = await handleListDeployedContracts(
          validatedArgs as ListDeployedContractsInput,
          options,
        );
        break;
      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                createErrorResponse(
                  ErrorCodes.MM_INVALID_INPUT,
                  `Unknown tool: ${name}`,
                  undefined,
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
