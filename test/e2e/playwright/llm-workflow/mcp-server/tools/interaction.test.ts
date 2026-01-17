import { ErrorCodes } from '../types';
import { handleClick, handleType, handleWaitFor } from './interaction';

jest.mock('../session-manager', () => ({
  sessionManager: {
    hasActiveSession: jest.fn(),
    getSessionId: jest.fn(),
    getPage: jest.fn(),
    getRefMap: jest.fn(),
    setRefMap: jest.fn(),
    getExtensionState: jest.fn(),
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
  waitForTarget: jest.fn(),
}));

describe('Interaction Tools', () => {
  const mockLocator = {
    click: jest.fn().mockResolvedValue(undefined),
    fill: jest.fn().mockResolvedValue(undefined),
  };

  const mockPage = {
    url: jest.fn().mockReturnValue('chrome-extension://test/home.html'),
    locator: jest.fn().mockReturnValue(mockLocator),
    getByTestId: jest.fn().mockReturnValue({
      ...mockLocator,
      waitFor: jest.fn().mockResolvedValue(undefined),
    }),
    accessibility: {
      snapshot: jest.fn().mockResolvedValue({
        role: 'WebArea',
        name: '',
        children: [],
      }),
    },
    evaluate: jest.fn().mockResolvedValue([]),
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
    sessionManager.getRefMap.mockReturnValue(
      new Map([['e1', 'button[name="Send"]']]),
    );
    sessionManager.getExtensionState.mockResolvedValue(mockState);

    const { knowledgeStore } = jest.requireMock('../knowledge-store');
    knowledgeStore.recordStep.mockResolvedValue('/test/step.json');

    const discovery = jest.requireMock('../discovery');
    discovery.collectTestIds.mockResolvedValue([]);
    discovery.collectTrimmedA11ySnapshot.mockResolvedValue({
      nodes: [],
      refMap: new Map(),
    });
    discovery.waitForTarget.mockResolvedValue(mockLocator);
  });

  describe('handleClick', () => {
    it('returns error when no active session', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.hasActiveSession.mockReturnValue(false);
      sessionManager.getSessionId.mockReturnValue(undefined);

      const result = await handleClick({ testId: 'send-button' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });

    it('returns error when no target specified', async () => {
      const result = await handleClick({} as Parameters<typeof handleClick>[0]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_INVALID_INPUT);
      }
    });

    it('returns error when multiple targets specified', async () => {
      const result = await handleClick({
        testId: 'button',
        selector: '.button',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_INVALID_INPUT);
      }
    });

    it('clicks element by testId', async () => {
      const result = await handleClick({ testId: 'send-button' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.clicked).toBe(true);
        expect(result.result.target).toBe('testId:send-button');
      }
    });

    it('clicks element by a11yRef', async () => {
      const result = await handleClick({ a11yRef: 'e1' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.clicked).toBe(true);
        expect(result.result.target).toBe('a11yRef:e1');
      }
    });

    it('clicks element by selector', async () => {
      const result = await handleClick({ selector: '.send-btn' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.clicked).toBe(true);
        expect(result.result.target).toBe('selector:.send-btn');
      }
    });

    it('records step in knowledge store', async () => {
      const { knowledgeStore } = jest.requireMock('../knowledge-store');

      await handleClick({ testId: 'send-button' });

      expect(knowledgeStore.recordStep).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'mm-test-session',
          toolName: 'mm_click',
          target: { testId: 'send-button' },
          outcome: { ok: true },
        }),
      );
    });

    it('returns error when element not found', async () => {
      const discovery = jest.requireMock('../discovery');
      discovery.waitForTarget.mockRejectedValueOnce(
        new Error('Element not found'),
      );

      const result = await handleClick({ testId: 'missing-button' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_TARGET_NOT_FOUND);
      }
    });

    it('uses custom timeout', async () => {
      const discovery = jest.requireMock('../discovery');

      await handleClick({ testId: 'button', timeoutMs: 5000 });

      expect(discovery.waitForTarget).toHaveBeenCalledWith(
        expect.anything(),
        'testId',
        'button',
        expect.any(Map),
        5000,
      );
    });
  });

  describe('handleType', () => {
    it('returns error when no active session', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.hasActiveSession.mockReturnValue(false);
      sessionManager.getSessionId.mockReturnValue(undefined);

      const result = await handleType({
        testId: 'input',
        text: 'hello',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });

    it('returns error when no target specified', async () => {
      const result = await handleType({
        text: 'hello',
      } as Parameters<typeof handleType>[0]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_INVALID_INPUT);
      }
    });

    it('types text into element by testId', async () => {
      const result = await handleType({
        testId: 'password-input',
        text: 'secret123',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.typed).toBe(true);
        expect(result.result.target).toBe('testId:password-input');
        expect(result.result.textLength).toBe(9);
      }
    });

    it('types text into element by a11yRef', async () => {
      const result = await handleType({
        a11yRef: 'e1',
        text: 'test',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.typed).toBe(true);
        expect(result.result.target).toBe('a11yRef:e1');
      }
    });

    it('fills element with provided text', async () => {
      await handleType({
        testId: 'input',
        text: 'my text',
      });

      expect(mockLocator.fill).toHaveBeenCalledWith('my text');
    });

    it('records step in knowledge store with text', async () => {
      const { knowledgeStore } = jest.requireMock('../knowledge-store');

      await handleType({
        testId: 'input',
        text: 'sensitive',
      });

      expect(knowledgeStore.recordStep).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'mm-test-session',
          toolName: 'mm_type',
          input: expect.objectContaining({
            text: 'sensitive',
            testId: 'input',
          }),
        }),
      );
    });

    it('returns error when element not found', async () => {
      const discovery = jest.requireMock('../discovery');
      discovery.waitForTarget.mockRejectedValueOnce(
        new Error('Element not found'),
      );

      const result = await handleType({
        testId: 'missing-input',
        text: 'test',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_TARGET_NOT_FOUND);
      }
    });

    it('redacts text in error response', async () => {
      const discovery = jest.requireMock('../discovery');
      discovery.waitForTarget.mockRejectedValueOnce(
        new Error('Element not found'),
      );

      const result = await handleType({
        testId: 'input',
        text: 'my-secret-password',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.details).toEqual({
          input: expect.objectContaining({
            text: '[REDACTED]',
          }),
        });
      }
    });
  });

  describe('handleWaitFor', () => {
    it('returns error when no active session', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      sessionManager.hasActiveSession.mockReturnValue(false);
      sessionManager.getSessionId.mockReturnValue(undefined);

      const result = await handleWaitFor({ testId: 'element' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      }
    });

    it('returns error when no target specified', async () => {
      const result = await handleWaitFor(
        {} as Parameters<typeof handleWaitFor>[0],
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_INVALID_INPUT);
      }
    });

    it('waits for element by testId', async () => {
      const result = await handleWaitFor({ testId: 'loading-indicator' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.found).toBe(true);
        expect(result.result.target).toBe('testId:loading-indicator');
      }
    });

    it('waits for element by a11yRef', async () => {
      const result = await handleWaitFor({ a11yRef: 'e1' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.found).toBe(true);
        expect(result.result.target).toBe('a11yRef:e1');
      }
    });

    it('waits for element by selector', async () => {
      const result = await handleWaitFor({ selector: '.spinner' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.found).toBe(true);
        expect(result.result.target).toBe('selector:.spinner');
      }
    });

    it('uses custom timeout', async () => {
      const discovery = jest.requireMock('../discovery');

      await handleWaitFor({ testId: 'element', timeoutMs: 60000 });

      expect(discovery.waitForTarget).toHaveBeenCalledWith(
        expect.anything(),
        'testId',
        'element',
        expect.any(Map),
        60000,
      );
    });

    it('returns timeout error when element does not appear', async () => {
      const discovery = jest.requireMock('../discovery');
      discovery.waitForTarget.mockRejectedValueOnce(
        new Error('Timeout exceeded'),
      );

      const result = await handleWaitFor({ testId: 'slow-element' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_WAIT_TIMEOUT);
      }
    });

    it('records step in knowledge store', async () => {
      const { knowledgeStore } = jest.requireMock('../knowledge-store');

      await handleWaitFor({ testId: 'element' });

      expect(knowledgeStore.recordStep).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'mm-test-session',
          toolName: 'mm_wait_for',
          target: { testId: 'element' },
          outcome: { ok: true },
        }),
      );
    });

    it('updates refMap after wait completes', async () => {
      const { sessionManager } = jest.requireMock('../session-manager');
      const discovery = jest.requireMock('../discovery');
      const newRefMap = new Map([['e1', 'new-selector']]);
      discovery.collectTrimmedA11ySnapshot.mockResolvedValueOnce({
        nodes: [],
        refMap: newRefMap,
      });

      await handleWaitFor({ testId: 'element' });

      expect(sessionManager.setRefMap).toHaveBeenCalledWith(newRefMap);
    });
  });
});
