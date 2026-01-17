import { ErrorCodes } from '../types';
import { handleNavigate, handleWaitForNotification } from './navigation';

jest.mock('../session-manager', () => ({
  sessionManager: {
    hasActiveSession: jest.fn(),
    getSessionId: jest.fn(),
    getPage: jest.fn(),
    setRefMap: jest.fn(),
    getExtensionState: jest.fn(),
    navigateToHome: jest.fn(),
    navigateToSettings: jest.fn(),
    navigateToUrl: jest.fn(),
    waitForNotificationPage: jest.fn(),
  },
}));

jest.mock('../knowledge-store', () => ({
  knowledgeStore: {
    recordStep: jest.fn(),
  },
  createDefaultObservation: jest.fn().mockReturnValue({
    state: {},
    testIds: [],
    a11y: { nodes: [] },
  }),
}));

jest.mock('../discovery', () => ({
  collectTestIds: jest.fn(),
  collectTrimmedA11ySnapshot: jest.fn(),
}));

describe('Navigation Tools', () => {
  const mockPage = {
    url: jest.fn().mockReturnValue('chrome-extension://test/home.html'),
    evaluate: jest.fn().mockResolvedValue([]),
    accessibility: {
      snapshot: jest.fn().mockResolvedValue({
        role: 'WebArea',
        name: '',
        children: [],
      }),
    },
  };

  const mockNotificationPage = {
    url: jest.fn().mockReturnValue('chrome-extension://test/notification.html'),
    evaluate: jest.fn().mockResolvedValue([]),
    accessibility: {
      snapshot: jest.fn().mockResolvedValue({
        role: 'WebArea',
        name: '',
        children: [],
      }),
    },
  };

  const mockState = {
    isLoaded: true,
    currentUrl: 'chrome-extension://test/home.html',
    extensionId: 'test-ext-id',
    isUnlocked: true,
    currentScreen: 'home',
    accountAddress: '0x1234567890abcdef',
    networkName: 'Localhost 8545',
    chainId: 1337,
    balance: '25 ETH',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const { sessionManager } = jest.requireMock('../session-manager');
    sessionManager.hasActiveSession.mockReturnValue(true);
    sessionManager.getSessionId.mockReturnValue('mm-test-session');
    sessionManager.getPage.mockReturnValue(mockPage);
    sessionManager.getExtensionState.mockResolvedValue(mockState);
    sessionManager.navigateToHome.mockResolvedValue(undefined);
    sessionManager.navigateToSettings.mockResolvedValue(undefined);
    sessionManager.navigateToUrl.mockResolvedValue(undefined);
    sessionManager.waitForNotificationPage.mockResolvedValue(
      mockNotificationPage,
    );

    const { knowledgeStore } = jest.requireMock('../knowledge-store');
    knowledgeStore.recordStep.mockResolvedValue('/test/step.json');

    const discovery = jest.requireMock('../discovery');
    discovery.collectTestIds.mockResolvedValue([]);
    discovery.collectTrimmedA11ySnapshot.mockResolvedValue({
      nodes: [],
      refMap: new Map(),
    });

    mockPage.url.mockReturnValue('chrome-extension://test/home.html');
  });

  describe('handleNavigate', () => {
    it('returns error when no active session', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.hasActiveSession.mockReturnValue(false);
      sessionManager.getSessionId.mockReturnValue(undefined);

      const result = await handleNavigate({ screen: 'home' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });

    it('navigates to home screen', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');

      const result = await handleNavigate({ screen: 'home' });

      expect(result.ok).toBe(true);
      expect(sessionManager.navigateToHome).toHaveBeenCalled();
      if (result.ok) {
        expect(result.result.navigated).toBe(true);
      }
    });

    it('navigates to settings screen', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');

      const result = await handleNavigate({ screen: 'settings' });

      expect(result.ok).toBe(true);
      expect(sessionManager.navigateToSettings).toHaveBeenCalled();
      if (result.ok) {
        expect(result.result.navigated).toBe(true);
      }
    });

    it('navigates to notification screen', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');

      const result = await handleNavigate({ screen: 'notification' });

      expect(result.ok).toBe(true);
      expect(sessionManager.waitForNotificationPage).toHaveBeenCalledWith(
        15000,
      );
      if (result.ok) {
        expect(result.result.navigated).toBe(true);
      }
    });

    it('navigates to custom URL', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');

      const result = await handleNavigate({
        screen: 'url',
        url: 'https://example.com',
      });

      expect(result.ok).toBe(true);
      expect(sessionManager.navigateToUrl).toHaveBeenCalledWith(
        'https://example.com',
      );
      if (result.ok) {
        expect(result.result.navigated).toBe(true);
      }
    });

    it('returns error when url screen is used without url', async () => {
      const result = await handleNavigate({ screen: 'url' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_INVALID_INPUT);
        expect(result.error.message).toContain('url is required');
      }
    });

    it('returns error for unknown screen', async () => {
      const result = await handleNavigate({
        screen: 'unknown' as Parameters<typeof handleNavigate>[0]['screen'],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_INVALID_INPUT);
        expect(result.error.message).toContain('Unknown screen');
      }
    });

    it('records step in knowledge store', async () => {
      const { knowledgeStore } = jest.requireMock('../knowledge-store');

      await handleNavigate({ screen: 'home' });

      expect(knowledgeStore.recordStep).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'mm-test-session',
          toolName: 'mm_navigate',
          input: { screen: 'home', url: undefined },
          outcome: { ok: true },
        }),
      );
    });

    it('updates refMap after navigation', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      const discovery = jest.requireMock('../discovery');
      const newRefMap = new Map([['e1', 'new-selector']]);
      discovery.collectTrimmedA11ySnapshot.mockResolvedValueOnce({
        nodes: [],
        refMap: newRefMap,
      });

      await handleNavigate({ screen: 'home' });

      expect(sessionManager.setRefMap).toHaveBeenCalledWith(newRefMap);
    });

    it('returns current URL in result', async () => {
      mockPage.url.mockReturnValue('chrome-extension://test/settings.html');

      const result = await handleNavigate({ screen: 'settings' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.currentUrl).toBe(
          'chrome-extension://test/settings.html',
        );
      }
    });

    it('handles navigation failure', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.navigateToHome.mockRejectedValueOnce(
        new Error('Navigation timeout'),
      );

      const result = await handleNavigate({ screen: 'home' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NAVIGATION_FAILED);
        expect(result.error.message).toContain('Navigation failed');
      }
    });
  });

  describe('handleWaitForNotification', () => {
    it('returns error when no active session', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.hasActiveSession.mockReturnValue(false);
      sessionManager.getSessionId.mockReturnValue(undefined);

      const result = await handleWaitForNotification({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });

    it('waits for notification page with default timeout', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');

      const result = await handleWaitForNotification({});

      expect(result.ok).toBe(true);
      expect(sessionManager.waitForNotificationPage).toHaveBeenCalledWith(
        15000,
      );
      if (result.ok) {
        expect(result.result.found).toBe(true);
        expect(result.result.pageUrl).toBe(
          'chrome-extension://test/notification.html',
        );
      }
    });

    it('waits for notification page with custom timeout', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');

      await handleWaitForNotification({ timeoutMs: 30000 });

      expect(sessionManager.waitForNotificationPage).toHaveBeenCalledWith(
        30000,
      );
    });

    it('records step in knowledge store', async () => {
      const { knowledgeStore } = jest.requireMock('../knowledge-store');

      await handleWaitForNotification({ timeoutMs: 20000 });

      expect(knowledgeStore.recordStep).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'mm-test-session',
          toolName: 'mm_wait_for_notification',
          input: { timeoutMs: 20000 },
          outcome: { ok: true },
        }),
      );
    });

    it('collects discovery data from notification page', async () => {
      const discovery = jest.requireMock('../discovery');

      await handleWaitForNotification({});

      expect(discovery.collectTestIds).toHaveBeenCalledWith(
        mockNotificationPage,
        50,
      );
      expect(discovery.collectTrimmedA11ySnapshot).toHaveBeenCalledWith(
        mockNotificationPage,
      );
    });

    it('updates refMap with notification page elements', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      const discovery = jest.requireMock('../discovery');
      const newRefMap = new Map([['e1', 'confirm-button']]);
      discovery.collectTrimmedA11ySnapshot.mockResolvedValueOnce({
        nodes: [],
        refMap: newRefMap,
      });

      await handleWaitForNotification({});

      expect(sessionManager.setRefMap).toHaveBeenCalledWith(newRefMap);
    });

    it('returns timeout error when notification does not appear', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.waitForNotificationPage.mockRejectedValueOnce(
        new Error('Timeout waiting for notification'),
      );

      const result = await handleWaitForNotification({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NOTIFICATION_TIMEOUT);
        expect(result.error.message).toContain(
          'Notification popup did not appear',
        );
      }
    });

    it('includes timeout in error details', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.waitForNotificationPage.mockRejectedValueOnce(
        new Error('Timeout'),
      );

      const result = await handleWaitForNotification({ timeoutMs: 5000 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.details).toEqual({ timeoutMs: 5000 });
      }
    });
  });
});
