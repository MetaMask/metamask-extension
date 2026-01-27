import { SessionManager } from './session-manager';
import { ErrorCodes } from './types';

const mockLaunchMetaMask = jest.fn();

jest.mock('..', () => ({
  launchMetaMask: (...args: unknown[]) => mockLaunchMetaMask(...args),
  FixturePresets: {
    default: jest.fn().mockReturnValue({ data: {} }),
    onboarding: jest.fn().mockReturnValue({ data: {} }),
    withMultipleAccounts: jest.fn().mockReturnValue({ data: {} }),
    withERC20Tokens: jest.fn().mockReturnValue({ data: {} }),
    withConnectedDapp: jest.fn().mockReturnValue({ data: {} }),
    withPopularNetworks: jest.fn().mockReturnValue({ data: {} }),
    withMainnet: jest.fn().mockReturnValue({ data: {} }),
    withNFTs: jest.fn().mockReturnValue({ data: {} }),
    withFiatDisabled: jest.fn().mockReturnValue({ data: {} }),
  },
}));

jest.mock('./knowledge-store', () => ({
  knowledgeStore: {
    writeSessionMetadata: jest.fn().mockResolvedValue('/test/session.json'),
    getGitInfoSync: jest.fn().mockReturnValue({
      branch: 'main',
      commit: 'abc123',
      dirty: false,
    }),
  },
}));

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  const mockPage = {
    goto: jest.fn().mockResolvedValue(undefined),
    waitForLoadState: jest.fn().mockResolvedValue(undefined),
    url: jest.fn().mockReturnValue('chrome-extension://test/home.html'),
  };

  const mockContext = {
    pages: jest.fn().mockReturnValue([mockPage]),
  };

  const mockLauncher = {
    getPage: jest.fn().mockReturnValue(mockPage),
    getContext: jest.fn().mockReturnValue(mockContext),
    getState: jest.fn().mockResolvedValue({
      isLoaded: true,
      currentUrl: 'chrome-extension://test/home.html',
      extensionId: 'test-ext-id',
      isUnlocked: true,
      currentScreen: 'home',
      accountAddress: '0x1234567890abcdef',
      networkName: 'Localhost 8545',
      chainId: 1337,
      balance: '25 ETH',
    }),
    cleanup: jest.fn().mockResolvedValue(undefined),
    navigateToHome: jest.fn().mockResolvedValue(undefined),
    navigateToSettings: jest.fn().mockResolvedValue(undefined),
    waitForNotificationPage: jest.fn().mockResolvedValue(mockPage),
    screenshot: jest.fn().mockResolvedValue({
      path: '/test/screenshot.png',
      base64: 'base64data',
      width: 1280,
      height: 800,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLaunchMetaMask.mockResolvedValue(mockLauncher);
    sessionManager = new SessionManager();
  });

  describe('hasActiveSession', () => {
    it('returns false when no session is active', () => {
      expect(sessionManager.hasActiveSession()).toBe(false);
    });

    it('returns true after launching a session', async () => {
      await sessionManager.launch({});
      expect(sessionManager.hasActiveSession()).toBe(true);
    });
  });

  describe('getSessionId', () => {
    it('returns undefined when no session is active', () => {
      expect(sessionManager.getSessionId()).toBeUndefined();
    });

    it('returns session ID after launch', async () => {
      await sessionManager.launch({});
      const sessionId = sessionManager.getSessionId();
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^mm-/u);
    });
  });

  describe('launch', () => {
    it('launches with default options', async () => {
      const result = await sessionManager.launch({});

      expect(result.sessionId).toMatch(/^mm-/u);
      expect(result.extensionId).toBe('test-ext-id');
      expect(result.state.isUnlocked).toBe(true);
      expect(result.state.currentScreen).toBe('home');
    });

    it('throws when session already running', async () => {
      await sessionManager.launch({});

      await expect(sessionManager.launch({})).rejects.toThrow(
        ErrorCodes.MM_SESSION_ALREADY_RUNNING,
      );
    });

    it('stores session metadata', async () => {
      await sessionManager.launch({
        goal: 'Test goal',
        flowTags: ['send', 'swap'],
        tags: ['smoke'],
      });

      const metadata = sessionManager.getSessionMetadata();
      expect(metadata).toBeDefined();
      expect(metadata?.goal).toBe('Test goal');
      expect(metadata?.flowTags).toEqual(['send', 'swap']);
      expect(metadata?.tags).toEqual(['smoke']);
    });

    it('uses custom state mode', async () => {
      await sessionManager.launch({ stateMode: 'onboarding' });

      expect(mockLaunchMetaMask).toHaveBeenCalledWith(
        expect.objectContaining({
          stateMode: 'onboarding',
        }),
      );
    });

    it('uses fixture preset when stateMode is custom', async () => {
      const { FixturePresets } = jest.requireMock('..');

      await sessionManager.launch({
        stateMode: 'custom',
        fixturePreset: 'withMultipleAccounts',
      });

      expect(FixturePresets.withMultipleAccounts).toHaveBeenCalled();
      expect(mockLaunchMetaMask).toHaveBeenCalledWith(
        expect.objectContaining({
          stateMode: 'custom',
          fixture: expect.any(Object),
        }),
      );
    });
  });

  describe('cleanup', () => {
    it('returns false when no session is active', async () => {
      const result = await sessionManager.cleanup();
      expect(result).toBe(false);
    });

    it('cleans up active session', async () => {
      await sessionManager.launch({});
      expect(sessionManager.hasActiveSession()).toBe(true);

      const result = await sessionManager.cleanup();
      expect(result).toBe(true);
      expect(sessionManager.hasActiveSession()).toBe(false);
      expect(sessionManager.getSessionId()).toBeUndefined();
    });

    it('calls launcher cleanup', async () => {
      await sessionManager.launch({});
      await sessionManager.cleanup();

      expect(mockLauncher.cleanup).toHaveBeenCalled();
    });

    it('clears ref map', async () => {
      await sessionManager.launch({});
      sessionManager.setRefMap(new Map([['e1', 'button']]));
      expect(sessionManager.getRefMap().size).toBe(1);

      await sessionManager.cleanup();
      expect(sessionManager.getRefMap().size).toBe(0);
    });
  });

  describe('getPage', () => {
    it('throws when no session is active', () => {
      expect(() => sessionManager.getPage()).toThrow(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
      );
    });

    it('returns page from launcher', async () => {
      await sessionManager.launch({});
      const page = sessionManager.getPage();
      expect(page).toBe(mockPage);
    });
  });

  describe('getContext', () => {
    it('throws when no session is active', () => {
      expect(() => sessionManager.getContext()).toThrow(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
      );
    });

    it('returns context from launcher', async () => {
      await sessionManager.launch({});
      const context = sessionManager.getContext();
      expect(context).toBe(mockContext);
    });
  });

  describe('getExtensionState', () => {
    it('throws when no session is active', async () => {
      await expect(sessionManager.getExtensionState()).rejects.toThrow(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
      );
    });

    it('returns state from launcher', async () => {
      await sessionManager.launch({});
      const state = await sessionManager.getExtensionState();

      expect(state.isUnlocked).toBe(true);
      expect(state.currentScreen).toBe('home');
      expect(state.balance).toBe('25 ETH');
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      await sessionManager.launch({});
    });

    it('navigates to home', async () => {
      await sessionManager.navigateToHome();
      expect(mockLauncher.navigateToHome).toHaveBeenCalled();
    });

    it('navigates to settings', async () => {
      await sessionManager.navigateToSettings();
      expect(mockLauncher.navigateToSettings).toHaveBeenCalled();
    });

    it('navigates to URL', async () => {
      await sessionManager.navigateToUrl('https://example.com');
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com');
      expect(mockPage.waitForLoadState).toHaveBeenCalledWith(
        'domcontentloaded',
      );
    });

    it('waits for notification page', async () => {
      const page = await sessionManager.waitForNotificationPage(5000);
      expect(mockLauncher.waitForNotificationPage).toHaveBeenCalledWith(5000);
      expect(page).toBe(mockPage);
    });
  });

  describe('screenshot', () => {
    beforeEach(async () => {
      await sessionManager.launch({});
    });

    it('takes screenshot', async () => {
      const result = await sessionManager.screenshot({ name: 'test' });

      expect(mockLauncher.screenshot).toHaveBeenCalledWith({ name: 'test' });
      expect(result.path).toBe('/test/screenshot.png');
      expect(result.width).toBe(1280);
    });

    it('throws when no session is active', async () => {
      await sessionManager.cleanup();

      await expect(sessionManager.screenshot({ name: 'test' })).rejects.toThrow(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
      );
    });
  });

  describe('refMap management', () => {
    it('starts with empty ref map', () => {
      expect(sessionManager.getRefMap().size).toBe(0);
    });

    it('sets and gets ref map', () => {
      const map = new Map([
        ['e1', 'button[name="Send"]'],
        ['e2', 'input[type="text"]'],
      ]);
      sessionManager.setRefMap(map);

      expect(sessionManager.getRefMap()).toBe(map);
    });

    it('resolves a11y ref', () => {
      sessionManager.setRefMap(new Map([['e1', 'button[name="Send"]']]));

      expect(sessionManager.resolveA11yRef('e1')).toBe('button[name="Send"]');
      expect(sessionManager.resolveA11yRef('e99')).toBeUndefined();
    });

    it('clears ref map', () => {
      sessionManager.setRefMap(new Map([['e1', 'button']]));
      sessionManager.clearRefMap();

      expect(sessionManager.getRefMap().size).toBe(0);
    });
  });
});
