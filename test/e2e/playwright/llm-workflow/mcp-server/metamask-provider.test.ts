import { MetaMaskSessionManager } from './metamask-provider';

const mockValidateExtensionBuilt = jest.fn();

jest.mock('../validate-extension', () => ({
  validateExtensionBuilt: (...args: unknown[]) =>
    mockValidateExtensionBuilt(...args),
}));

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

  describe('launch — extension validation', () => {
    it('throws MM_LAUNCH_FAILED when extension manifest is missing', async () => {
      mockValidateExtensionBuilt.mockRejectedValue(
        new Error('Extension not built.\n\nyarn build:test'),
      );

      await expect(sessionManager.launch({})).rejects.toThrow(
        'MM_LAUNCH_FAILED',
      );
    });

    it('includes build instructions in error when manifest is missing', async () => {
      mockValidateExtensionBuilt.mockRejectedValue(
        new Error('Extension not built.\n\nyarn build:test'),
      );

      await expect(sessionManager.launch({})).rejects.toThrow(
        'yarn build:test',
      );
    });

    it('validates custom extensionPath when provided', async () => {
      mockValidateExtensionBuilt.mockRejectedValue(
        new Error('Extension not built.'),
      );

      await expect(
        sessionManager.launch({ extensionPath: '/custom/path' }),
      ).rejects.toThrow();

      expect(mockValidateExtensionBuilt).toHaveBeenCalledWith('/custom/path');
    });

    it('passes undefined to validateExtensionBuilt when no extensionPath given', async () => {
      mockValidateExtensionBuilt.mockRejectedValue(
        new Error('Extension not built.'),
      );

      await expect(sessionManager.launch({})).rejects.toThrow();

      expect(mockValidateExtensionBuilt).toHaveBeenCalledWith(undefined);
    });
  });
});
