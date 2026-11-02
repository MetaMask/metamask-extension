import type {
  SessionLaunchInput,
  WorkflowContext,
} from '@metamask/client-mcp-core';
import { MetaMaskSessionManager } from './metamask-provider';
import { MetaMaskExtensionLauncher } from '.';

jest.mock('.', () => ({
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

jest.mock('./capabilities/factory', () => ({
  createMetaMaskE2EContext: jest.fn().mockReturnValue({
    fixture: undefined,
    chain: undefined,
    contractSeeding: undefined,
    stateSnapshot: {
      getState: jest.fn().mockResolvedValue({ screen: 'home' }),
    },
    config: {
      environment: 'e2e',
      extensionName: 'MetaMask',
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
    config: {
      environment: 'prod',
      extensionName: 'MetaMask',
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

  describe('launch', () => {
    const PHRASE = Array.from({ length: 12 }, () => 'abandon').join(' ');
    const PASSWORD = 'per-run-vault-password';

    beforeEach(() => {
      sessionManager.setWorkflowContext({
        config: { environment: 'prod', defaultChainId: 1337 },
        stateSnapshot: {
          getState: jest.fn().mockResolvedValue({ currentScreen: 'home' }),
        },
      } as unknown as WorkflowContext);
    });

    it('hands the self-onboarding phrase and password to the launcher and clears them from the request', async () => {
      const request = {
        stateMode: 'onboarding' as const,
        selfOnboarding: true,
        srp: PHRASE,
        password: PASSWORD,
      };

      await sessionManager.launch(request);

      expect(MetaMaskExtensionLauncher).toHaveBeenCalledWith(
        expect.objectContaining({
          selfOnboarding: true,
          srp: PHRASE,
          password: PASSWORD,
        }),
      );
      expect(request.srp).toBeUndefined();
      expect(request.password).toBeUndefined();
    });

    it('leaves the password unset when the request has none', async () => {
      await sessionManager.launch({
        stateMode: 'onboarding',
        selfOnboarding: true,
        srp: PHRASE,
      } as SessionLaunchInput);

      expect(MetaMaskExtensionLauncher).toHaveBeenCalledWith(
        expect.objectContaining({ password: undefined }),
      );
    });
  });
});
