export const TOOL_DEFINITIONS = [
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
      'Wait for MetaMask notification popup to appear (e.g., after dapp interaction). Sets the notification page as the active page for subsequent interactions.',
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
    name: 'mm_switch_to_tab',
    description:
      'Switch the active page to a different tracked tab. Use this to direct mm_click, mm_type, and other interaction tools to a specific page.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['extension', 'notification', 'dapp', 'other'],
          description: 'Tab role to switch to',
        },
        url: {
          type: 'string',
          minLength: 1,
          description: 'URL prefix to match for tab switching',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mm_close_tab',
    description:
      'Close a specific tab by role or URL. Cannot close the extension home page. If closing the active tab, automatically switches to extension home.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['notification', 'dapp', 'other'],
          description: 'Tab role to close (cannot close extension)',
        },
        url: {
          type: 'string',
          minLength: 1,
          description: 'URL prefix to match for tab closing',
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
  {
    name: 'mm_run_steps',
    description:
      'Execute multiple tools in sequence. Reduces round trips for multi-step flows.',
    inputSchema: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: {
                type: 'string',
                description: 'Tool name (e.g., mm_click, mm_type)',
              },
              args: {
                type: 'object',
                description: 'Tool arguments',
              },
            },
            required: ['tool'],
            additionalProperties: false,
          },
          minItems: 1,
          maxItems: 50,
          description: 'Array of tool calls to execute in order',
        },
        stopOnError: {
          type: 'boolean',
          default: false,
          description: 'Stop execution on first error (default: false)',
        },
        includeObservations: {
          type: 'string',
          enum: ['none', 'failures', 'all'],
          default: 'all',
          description: 'When to include observations in results',
        },
      },
      required: ['steps'],
      additionalProperties: false,
    },
  },
];
