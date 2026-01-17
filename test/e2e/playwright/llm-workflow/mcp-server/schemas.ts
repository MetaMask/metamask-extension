/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Zod Schemas for MCP Server Tool Inputs
 *
 * This file defines Zod schemas with rich `.describe()` annotations
 * to provide context for AI agents. All tool inputs are validated
 * against these schemas before being passed to handlers.
 */

import { z } from 'zod';

// =============================================================================
// Common Schemas
// =============================================================================

/**
 * Accessibility reference pattern (e1, e2, e3, ...)
 */
export const a11yRefPattern = z
  .string()
  .regex(/^e[0-9]+$/u)
  .describe(
    'Accessibility ref from mm_accessibility_snapshot (e.g., e1, e2). ' +
      'These refs are ephemeral and only valid within the current screen state.',
  );

/**
 * Target selection - exactly one must be provided
 */
export const targetSelectionSchema = z
  .object({
    a11yRef: a11yRefPattern.optional(),
    testId: z
      .string()
      .min(1)
      .describe(
        'data-testid attribute value (stable, preferred for interactions)',
      )
      .optional(),
    selector: z
      .string()
      .min(1)
      .describe('CSS selector (fallback, less stable than testId)')
      .optional(),
  })
  .refine(
    (data) => {
      const provided = [data.a11yRef, data.testId, data.selector].filter(
        Boolean,
      );
      return provided.length === 1;
    },
    {
      message: 'Exactly one of a11yRef, testId, or selector must be provided',
    },
  );

/**
 * Knowledge scope for cross-session queries
 */
export const knowledgeScopeSchema = z.union([
  z.literal('current').describe('Only search the active session'),
  z.literal('all').describe('Search all sessions in the knowledge store'),
  z
    .object({
      sessionId: z.string().min(4).describe('Specific session ID to query'),
    })
    .describe('Query a specific prior session by ID'),
]);

/**
 * Filters for knowledge queries
 */
export const knowledgeFiltersSchema = z
  .object({
    flowTag: z
      .string()
      .min(1)
      .describe('Filter by flow tag (e.g., send, swap, connect, sign)')
      .optional(),
    tag: z.string().min(1).describe('Filter by free-form tag').optional(),
    screen: z
      .string()
      .min(1)
      .describe('Filter by screen name (e.g., home, unlock, settings)')
      .optional(),
    sinceHours: z
      .number()
      .int()
      .min(1)
      .max(720)
      .describe('Only include sessions/steps from the last N hours')
      .optional(),
    gitBranch: z
      .string()
      .min(1)
      .describe('Filter by git branch name')
      .optional(),
  })
  .optional();

// =============================================================================
// Tool Input Schemas
// =============================================================================

/**
 * mm_build - Build the MetaMask extension
 */
export const buildInputSchema = z.object({
  buildType: z
    .enum(['build:test'])
    .default('build:test')
    .describe('Build command to run. Currently only build:test is supported.'),
  force: z
    .boolean()
    .default(false)
    .describe('Force rebuild even if a build already exists'),
});

/**
 * mm_launch - Launch MetaMask in a headed browser
 */
export const launchInputSchema = z.object({
  autoBuild: z
    .boolean()
    .default(true)
    .describe('Automatically run build if extension is not found'),
  stateMode: z
    .enum(['default', 'onboarding', 'custom'])
    .default('default')
    .describe(
      'Wallet state mode: ' +
        'default = pre-onboarded wallet with 25 ETH, ' +
        'onboarding = fresh wallet requiring setup, ' +
        'custom = use provided fixture',
    ),
  fixturePreset: z
    .string()
    .min(1)
    .describe(
      'Name of preset fixture (e.g., withMultipleAccounts, withERC20Tokens). ' +
        'Only used when stateMode=custom.',
    )
    .optional(),
  fixture: z
    .record(z.string(), z.unknown())
    .describe('Direct fixture object for stateMode=custom')
    .optional(),
  ports: z
    .object({
      anvil: z
        .number()
        .int()
        .min(1)
        .max(65535)
        .describe('Port for Anvil local chain (default: 8545)')
        .optional(),
      fixtureServer: z
        .number()
        .int()
        .min(1)
        .max(65535)
        .describe('Port for fixture server (default: 12345)')
        .optional(),
    })
    .optional(),
  slowMo: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .default(0)
    .describe('Slow down Playwright actions by N milliseconds (for debugging)'),
  extensionPath: z
    .string()
    .describe('Custom path to built extension directory')
    .optional(),
  goal: z
    .string()
    .describe('Goal or task description for this session (for knowledge store)')
    .optional(),
  flowTags: z
    .array(z.string())
    .describe(
      'Flow tags for categorization (e.g., ["send"], ["swap", "confirmation"]). ' +
        'Used for cross-session knowledge retrieval.',
    )
    .optional(),
  tags: z
    .array(z.string())
    .describe('Free-form tags for ad-hoc filtering')
    .optional(),
});

/**
 * mm_cleanup - Stop the browser and all services
 */
export const cleanupInputSchema = z.object({
  sessionId: z
    .string()
    .describe('Session ID to clean up (optional, defaults to current)')
    .optional(),
});

/**
 * mm_get_state - Get current extension state
 */
export const getStateInputSchema = z.object({});

/**
 * mm_navigate - Navigate to a specific screen
 */
export const navigateInputSchema = z
  .object({
    screen: z
      .enum(['home', 'settings', 'notification', 'url'])
      .describe(
        'Target screen: home, settings, notification (popup), or url (custom)',
      ),
    url: z
      .string()
      .min(1)
      .describe('URL to navigate to (required when screen="url")')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.screen === 'url' && !data.url) {
        return false;
      }
      return true;
    },
    {
      message: 'url is required when screen is "url"',
      path: ['url'],
    },
  );

/**
 * mm_wait_for_notification - Wait for notification popup
 */
export const waitForNotificationInputSchema = z.object({
  timeoutMs: z
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(15000)
    .describe('Timeout in milliseconds to wait for notification popup'),
});

/**
 * mm_list_testids - List visible testIds
 */
export const listTestIdsInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(150)
    .describe('Maximum number of testIds to return'),
});

/**
 * mm_accessibility_snapshot - Get trimmed a11y tree
 */
export const accessibilitySnapshotInputSchema = z.object({
  rootSelector: z
    .string()
    .min(1)
    .describe('CSS selector to scope the snapshot (optional)')
    .optional(),
});

/**
 * mm_describe_screen - Comprehensive screen state
 */
export const describeScreenInputSchema = z.object({
  includeScreenshot: z
    .boolean()
    .default(false)
    .describe('Capture and include a screenshot (opt-in for privacy)'),
  screenshotName: z
    .string()
    .min(1)
    .describe('Name for the screenshot file (without extension)')
    .optional(),
  includeScreenshotBase64: z
    .boolean()
    .default(false)
    .describe('Include base64-encoded screenshot in response'),
});

/**
 * mm_screenshot - Take a screenshot
 */
export const screenshotInputSchema = z.object({
  name: z.string().min(1).describe('Screenshot filename (without extension)'),
  fullPage: z
    .boolean()
    .default(true)
    .describe('Capture full page or just viewport'),
  selector: z
    .string()
    .min(1)
    .describe('CSS selector to capture specific element')
    .optional(),
  includeBase64: z
    .boolean()
    .default(false)
    .describe('Include base64-encoded image in response'),
});

/**
 * mm_click - Click an element
 */
export const clickInputSchema = targetSelectionSchema.and(
  z.object({
    timeoutMs: z
      .number()
      .int()
      .min(0)
      .max(60000)
      .default(15000)
      .describe('Timeout to wait for element to become visible'),
  }),
);

/**
 * mm_type - Type text into an element
 */
export const typeInputSchema = targetSelectionSchema.and(
  z.object({
    text: z.string().describe('Text to type into the element'),
    timeoutMs: z
      .number()
      .int()
      .min(0)
      .max(60000)
      .default(15000)
      .describe('Timeout to wait for element to become visible'),
  }),
);

/**
 * mm_wait_for - Wait for element to become visible
 */
export const waitForInputSchema = targetSelectionSchema.and(
  z.object({
    timeoutMs: z
      .number()
      .int()
      .min(100)
      .max(120000)
      .default(15000)
      .describe('Timeout to wait for element'),
  }),
);

/**
 * mm_knowledge_last - Get recent step records
 */
export const knowledgeLastInputSchema = z.object({
  n: z
    .number()
    .int()
    .min(1)
    .max(200)
    .default(20)
    .describe('Number of recent steps to retrieve'),
  scope: knowledgeScopeSchema
    .default('current')
    .describe(
      'Scope for retrieval: current session, all sessions, or specific session',
    ),
  filters: knowledgeFiltersSchema,
});

/**
 * mm_knowledge_search - Search step records
 */
export const knowledgeSearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe(
      'Search query - matches tool names, screen names, testIds, and a11y names',
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Maximum number of results'),
  scope: knowledgeScopeSchema
    .default('all')
    .describe(
      'Search scope (defaults to all sessions for cross-session learning)',
    ),
  filters: knowledgeFiltersSchema,
});

/**
 * mm_knowledge_summarize - Generate session summary
 */
export const knowledgeSummarizeInputSchema = z.object({
  sessionId: z
    .string()
    .describe('Deprecated: use scope. Session ID to summarize.')
    .optional(),
  scope: z
    .union([
      z.literal('current'),
      z.object({
        sessionId: z.string().min(4),
      }),
    ])
    .default('current')
    .describe('Session to summarize (cannot use "all")'),
});

/**
 * mm_knowledge_sessions - List recent sessions
 */
export const knowledgeSessionsInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of sessions to list'),
  filters: knowledgeFiltersSchema,
});

// =============================================================================
// Schema Map for Tool Lookup
// =============================================================================

/**
 * Map of tool names to their Zod schemas
 */
export const toolSchemas = {
  mm_build: buildInputSchema,
  mm_launch: launchInputSchema,
  mm_cleanup: cleanupInputSchema,
  mm_get_state: getStateInputSchema,
  mm_navigate: navigateInputSchema,
  mm_wait_for_notification: waitForNotificationInputSchema,
  mm_list_testids: listTestIdsInputSchema,
  mm_accessibility_snapshot: accessibilitySnapshotInputSchema,
  mm_describe_screen: describeScreenInputSchema,
  mm_screenshot: screenshotInputSchema,
  mm_click: clickInputSchema,
  mm_type: typeInputSchema,
  mm_wait_for: waitForInputSchema,
  mm_knowledge_last: knowledgeLastInputSchema,
  mm_knowledge_search: knowledgeSearchInputSchema,
  mm_knowledge_summarize: knowledgeSummarizeInputSchema,
  mm_knowledge_sessions: knowledgeSessionsInputSchema,
} as const;

export type ToolName = keyof typeof toolSchemas;

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

export function validateToolInput<T extends ToolName>(
  toolName: T,
  input: unknown,
): z.infer<(typeof toolSchemas)[T]> {
  const schema = toolSchemas[toolName];
  return schema.parse(input) as z.infer<(typeof toolSchemas)[T]>;
}

export function safeValidateToolInput<T extends ToolName>(
  toolName: T,
  input: unknown,
): SafeParseResult<z.infer<(typeof toolSchemas)[T]>> {
  const schema = toolSchemas[toolName];
  return schema.safeParse(input) as SafeParseResult<
    z.infer<(typeof toolSchemas)[T]>
  >;
}

// =============================================================================
// Inferred Types
// =============================================================================

export type BuildInputZ = z.infer<typeof buildInputSchema>;
export type LaunchInputZ = z.infer<typeof launchInputSchema>;
export type CleanupInputZ = z.infer<typeof cleanupInputSchema>;
export type GetStateInputZ = z.infer<typeof getStateInputSchema>;
export type NavigateInputZ = z.infer<typeof navigateInputSchema>;
export type WaitForNotificationInputZ = z.infer<
  typeof waitForNotificationInputSchema
>;
export type ListTestIdsInputZ = z.infer<typeof listTestIdsInputSchema>;
export type AccessibilitySnapshotInputZ = z.infer<
  typeof accessibilitySnapshotInputSchema
>;
export type DescribeScreenInputZ = z.infer<typeof describeScreenInputSchema>;
export type ScreenshotInputZ = z.infer<typeof screenshotInputSchema>;
export type ClickInputZ = z.infer<typeof clickInputSchema>;
export type TypeInputZ = z.infer<typeof typeInputSchema>;
export type WaitForInputZ = z.infer<typeof waitForInputSchema>;
export type KnowledgeLastInputZ = z.infer<typeof knowledgeLastInputSchema>;
export type KnowledgeSearchInputZ = z.infer<typeof knowledgeSearchInputSchema>;
export type KnowledgeSummarizeInputZ = z.infer<
  typeof knowledgeSummarizeInputSchema
>;
export type KnowledgeSessionsInputZ = z.infer<
  typeof knowledgeSessionsInputSchema
>;
export type KnowledgeScopeZ = z.infer<typeof knowledgeScopeSchema>;
export type KnowledgeFiltersZ = z.infer<typeof knowledgeFiltersSchema>;
