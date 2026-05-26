import { MetaMaskSessionManager } from './metamask-provider';

jest.mock('..', () => ({
  MetaMaskExtensionLauncher: jest.fn().mockImplementation(() => ({
    launch: jest.fn(),
    cleanup: jest.fn(),
    getExtensionId: jest.fn().mockReturnValue('test-extension-id'),
    getPage: jest.fn().mockReturnValue({}),
    getContext: jest
      .fn()
      .mockReturnValue({ pages: jest.fn().mockReturnValue([]) }),
  })),
}));

jest.mock('../capabilities/factory', () => ({
  createMetaMaskE2EContext: jest.fn().mockReturnValue({
    fixture: undefined,
    chain: undefined,
    contractSeeding: undefined,
    stateSnapshot: {
      getState: jest.fn().mockResolvedValue({ screen: 'home' }),
    },
    mockServer: undefined,
    config: {
      environment: 'e2e',
      extensionName: 'MetaMask',
      toolPrefix: 'mm',
      defaultChainId: 1337,
      defaultPassword: 'correct horse battery staple',
    },
  }),
  createMetaMaskProdContext: jest.fn().mockReturnValue({
    fixture: undefined,
    chain: undefined,
    contractSeeding: undefined,
    stateSnapshot: {
      getState: jest.fn().mockResolvedValue({ screen: 'home' }),
    },
    mockServer: undefined,
    config: {
      environment: 'prod',
      extensionName: 'MetaMask',
      toolPrefix: 'mm',
      defaultChainId: 1337,
      defaultPassword: 'correct horse battery staple',
    },
  }),
}));

jest.mock('@metamask/client-mcp-core', () => ({
  ErrorCodes: {
    MM_LAUNCH_FAILED: 'MM_LAUNCH_FAILED',
    MM_SESSION_ALREADY_RUNNING: 'MM_SESSION_ALREADY_RUNNING',
    MM_NO_ACTIVE_SESSION: 'MM_NO_ACTIVE_SESSION',
    MM_CONTEXT_SWITCH_BLOCKED: 'MM_CONTEXT_SWITCH_BLOCKED',
  },
  generateSessionId: jest.fn().mockReturnValue('test-session-id'),
  knowledgeStore: {
    writeSessionMetadata: jest.fn().mockResolvedValue(undefined),
  },
  MockServerCapability: class {},
}));

describe('MetaMaskSessionManager', () => {
  let sessionManager: MetaMaskSessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager = new MetaMaskSessionManager();
  });

  describe('getBuildCapability', () => {
    it('returns undefined (build capability removed)', () => {
      expect(sessionManager.getBuildCapability()).toBeUndefined();
    });
  });
});
