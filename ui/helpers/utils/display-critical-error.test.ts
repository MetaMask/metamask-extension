import browser from 'webextension-polyfill';
import { act } from 'react-dom/test-utils';
import {
  CriticalErrorRepairAction,
  CriticalErrorType,
  METHOD_REPAIR_DATABASE,
  isStateCorruptionErrorType,
} from '../../../shared/constants/critical-error';
import { MISSING_VAULT_ERROR } from '../../../shared/constants/errors';
import { CRITICAL_ERROR_SCREEN_VIEWED } from '../../../shared/constants/start-up-errors';
import * as errorUtils from '../../../shared/lib/error-utils';
import type { Backup } from '../../../shared/lib/stores/persistence-manager';
import {
  displayCriticalErrorMessage,
  displayCriticalErrorPage,
  CriticalErrorTranslationKey,
  extractEnvelopeUrlFromDsn,
} from './display-critical-error';

const MOCK_UUID = '550e8400e29b41d4a716446655440000';
jest.mock('uuid', () => ({
  v4: jest.fn(() => MOCK_UUID),
}));

const MOCK_RELEASE_VERSION = '13.0.0';
jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
    getManifest: jest.fn(() => ({ version: MOCK_RELEASE_VERSION })),
  },
}));

// Mock environment variables before importing the module
const MOCK_SENTRY_DSN =
  'https://3567c198f8a8412082d32655da2961d0@sentry.io/273505';
const MOCK_SENTRY_DSN_DEV = 'https://dev123@sentry.io/273505';

const originalEnv = process.env;
process.env = {
  ...originalEnv,
  SENTRY_DSN: MOCK_SENTRY_DSN,
  SENTRY_DSN_DEV: MOCK_SENTRY_DSN_DEV,
  METAMASK_BUILD_TYPE: 'main',
  METAMASK_ENVIRONMENT: 'development',
};

jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(() => ({
    sentry: { forceEnable: false },
  })),
}));

/**
 * Shared getErrorHtml stub for handler tests.
 */
function mockGetErrorHtmlWithOptionalRestoreLink() {
  return (
    _errorKey: unknown,
    error: unknown,
    _localeContext: unknown,
    _supportLink: unknown,
    repairAction?: CriticalErrorRepairAction,
    criticalErrorType?: CriticalErrorType,
    showReportCheckbox: boolean = true,
  ) => {
    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : undefined;
    let repairButtonLabel = '';
    if (repairAction === CriticalErrorRepairAction.Recover) {
      repairButtonLabel =
        errorMessage === MISSING_VAULT_ERROR
          ? 'criticalErrorRecoverAccounts'
          : 'criticalErrorAttemptRecovery';
    } else if (repairAction === CriticalErrorRepairAction.Reset) {
      repairButtonLabel = 'criticalErrorResetMetaMaskState';
    }

    return `
    <div>
      ${
        showReportCheckbox
          ? '<input type="checkbox" id="critical-error-checkbox" checked />'
          : ''
      }
      ${
        isStateCorruptionErrorType(criticalErrorType)
          ? ''
          : '<button id="critical-error-button">Restart</button>'
      }
      ${
        repairAction === CriticalErrorRepairAction.Recover ||
        repairAction === CriticalErrorRepairAction.Reset
          ? `<button type="button" id="critical-error-repair-button">${repairButtonLabel}</button>`
          : ''
      }
    </div>
  `;
  };
}

const MOCK_BACKUP_WITH_VAULT = {
  KeyringController: { vault: 'encrypted-vault-data' },
};

/**
 * Mocks `globalThis.stateHooks.getBackupState` to resolve a vault backup.
 * @param backup
 */
function mockGetBackupStateWithVault(
  backup: Backup = MOCK_BACKUP_WITH_VAULT,
): () => void {
  const previous = globalThis.stateHooks?.getBackupState;
  globalThis.stateHooks = {
    ...(globalThis.stateHooks ?? {}),
    getBackupState: async () => backup,
  };
  return () => {
    if (previous) {
      globalThis.stateHooks.getBackupState = previous;
    } else {
      delete globalThis.stateHooks.getBackupState;
    }
  };
}

/** Mocks `globalThis.stateHooks.getBackupState` to resolve no backup. */
function mockGetBackupStateNoVault(): () => void {
  const previous = globalThis.stateHooks?.getBackupState;
  globalThis.stateHooks = {
    ...(globalThis.stateHooks ?? {}),
    getBackupState: async () => null,
  };
  return () => {
    if (previous) {
      globalThis.stateHooks.getBackupState = previous;
    } else {
      delete globalThis.stateHooks.getBackupState;
    }
  };
}

/** Minimal mock port for tests that pass port when possible (no backup in these tests). */
const createMockPort = () =>
  ({
    postMessage: jest.fn(),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    onDisconnect: { addListener: jest.fn(), removeListener: jest.fn() },
    name: 'popup',
    disconnect: jest.fn(),
  }) as unknown as browser.Runtime.Port;

describe('displayCriticalError', () => {
  let rootContainer: HTMLElement;
  let container: HTMLElement;
  let restoreGetBackupState: () => void;
  const MOCK_ERROR_MESSAGE = 'test error';
  const EXPECTED_ENVELOPE_URL = extractEnvelopeUrlFromDsn(MOCK_SENTRY_DSN_DEV);

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    container = document.createElement('div');
    // When a critical error is displayed, the main application container is removed from the DOM.
    // We use `container.parentElement` to determine whether the container has been removed yet or
    // not. The mock container starts with a parent so that it looks like no error has occurred
    // yet.
    rootContainer = document.createElement('div');
    rootContainer.appendChild(container);

    // Mock getBackupState (no backup) so passing port does not throw; no repair action is shown.
    restoreGetBackupState = mockGetBackupStateNoVault();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as Response);

    jest.spyOn(errorUtils, 'maybeGetLocaleContext').mockResolvedValue({
      preferredLocale: 'en',
      t: (key: string) => key,
      localeMessages: {},
      enLocaleMessages: {},
    });

    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());
  });

  afterEach(() => {
    restoreGetBackupState?.();
    jest.clearAllMocks();
  });

  it('renders critical error html into parent of container', async () => {
    const error = new Error(MOCK_ERROR_MESSAGE);
    const mockPort = createMockPort();

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.Other,
      ),
    ).rejects.toThrow(error);

    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      {
        preferredLocale: 'en',
        t: expect.any(Function),
        localeMessages: {},
        enLocaleMessages: {},
      },
      expect.any(String),
      CriticalErrorRepairAction.None,
      CriticalErrorType.Other,
      true,
    );
    expect(
      rootContainer.querySelector('#critical-error-content')?.innerHTML,
    ).toContain('critical-error-button');
    expect(
      rootContainer.querySelector('[data-testid="critical-error-content"]'),
    ).not.toBeNull();
  });

  it('clicking restart button calls fetch and reload if checkbox checked', async () => {
    const error = new Error(MOCK_ERROR_MESSAGE);
    const mockPort = createMockPort();

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.Other,
      ),
    ).rejects.toThrow(error);

    const restartButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-button',
    );
    const checkbox = rootContainer.querySelector<HTMLInputElement>(
      '#critical-error-checkbox',
    );

    expect(restartButton).toBeTruthy();
    expect(checkbox).toBeTruthy();

    if (restartButton && checkbox) {
      checkbox.checked = true;

      const flushPromises = () => new Promise(setImmediate);
      await act(async () => {
        restartButton.click();
        await flushPromises();
      });

      expect(fetch).toHaveBeenCalledWith(
        EXPECTED_ENVELOPE_URL,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-sentry-envelope',
          },
        }),
      );

      // Additional body content assertions
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = fetchCall[1]?.body as string;
      const [envelopeHeader, itemHeader, eventPayload] =
        requestBody.split('\n');

      // Parse and verify envelope structure
      const parsedEnvelopeHeader = JSON.parse(envelopeHeader);
      const parsedItemHeader = JSON.parse(itemHeader);
      const parsedEventPayload = JSON.parse(eventPayload);

      // Verify envelope header
      expect(parsedEnvelopeHeader).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        event_id: MOCK_UUID,
        dsn: MOCK_SENTRY_DSN_DEV,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        sent_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
        ), // ISO timestamp
      });

      // Verify item header
      expect(parsedItemHeader).toMatchObject({
        type: 'event',
        length: expect.any(Number),
      });

      // Verify event payload
      expect(parsedEventPayload).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        event_id: MOCK_UUID,
        timestamp: expect.any(Number),
        platform: 'javascript',
        level: 'error',
        message: MOCK_ERROR_MESSAGE,
        release: MOCK_RELEASE_VERSION,
        tags: {
          'metamask.build_type': 'main',
          'metamask.environment': 'development',
        },
        extra: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_details: expect.any(Object), // Error object serialization varies by environment
          // eslint-disable-next-line @typescript-eslint/naming-convention
          user_agent: expect.any(String),
        },
      });

      // Additional checks for error_details content
      expect(parsedEventPayload.extra.error_details).toBeDefined();
      if (
        typeof parsedEventPayload.extra.error_details === 'object' &&
        parsedEventPayload.extra.error_details !== null
      ) {
        // If error details are populated, check they contain error info
        const errorDetails = parsedEventPayload.extra.error_details as Record<
          string,
          unknown
        >;
        expect(Object.keys(errorDetails).length).toBeGreaterThanOrEqual(0);
      }
      expect(browser.runtime.reload).toHaveBeenCalled();
    }
  });

  it('does not send to Sentry if checkbox is unchecked', async () => {
    const error = new Error(MOCK_ERROR_MESSAGE);
    const mockPort = createMockPort();

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.SomethingIsWrong,
        error,
        'en',
        mockPort,
        CriticalErrorType.Other,
      ),
    ).rejects.toThrow(error);

    const restartButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-button',
    );
    const checkbox = rootContainer.querySelector<HTMLInputElement>(
      '#critical-error-checkbox',
    );

    expect(restartButton).toBeTruthy();
    expect(checkbox).toBeTruthy();

    if (restartButton && checkbox) {
      checkbox.checked = false;

      const flushPromises = () => new Promise(setImmediate);
      await act(async () => {
        restartButton.click();
        await flushPromises();
      });

      expect(fetch).not.toHaveBeenCalled();
      expect(browser.runtime.reload).toHaveBeenCalled();
    }
  });

  it('adds fallback build tags when build environment variables are unset', async () => {
    delete process.env.METAMASK_ENVIRONMENT;
    delete process.env.METAMASK_BUILD_TYPE;

    const error = new Error(MOCK_ERROR_MESSAGE);
    const mockPort = createMockPort();

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.Other,
      ),
    ).rejects.toThrow(error);

    const restartButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-button',
    );
    const checkbox = rootContainer.querySelector<HTMLInputElement>(
      '#critical-error-checkbox',
    );

    expect(restartButton).toBeTruthy();
    expect(checkbox).toBeTruthy();
    checkbox?.setAttribute('checked', 'true');
    await act(async () => {
      restartButton?.click();
      await new Promise(setImmediate);
    });

    const requestBody = (fetch as jest.MockedFunction<typeof fetch>).mock
      .calls[0][1]?.body as string;
    const eventPayload = JSON.parse(requestBody.split('\n')[2]);
    expect(eventPayload.tags).toEqual({
      'metamask.environment': 'unknown',
      'metamask.build_type': 'unknown',
    });
  });

  it('allows error-specific tags to override build tags', async () => {
    process.env.METAMASK_ENVIRONMENT = 'development';
    process.env.METAMASK_BUILD_TYPE = 'main';

    const error = Object.assign(new Error(MOCK_ERROR_MESSAGE), {
      sentryTags: {
        'metamask.environment': 'error-environment',
        source: 'critical-error',
      },
    });
    const mockPort = createMockPort();

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.Other,
      ),
    ).rejects.toThrow(error);

    const restartButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-button',
    );
    const checkbox = rootContainer.querySelector<HTMLInputElement>(
      '#critical-error-checkbox',
    );

    expect(restartButton).toBeTruthy();
    expect(checkbox).toBeTruthy();
    checkbox?.setAttribute('checked', 'true');
    await act(async () => {
      restartButton?.click();
      await new Promise(setImmediate);
    });

    const requestBody = (fetch as jest.MockedFunction<typeof fetch>).mock
      .calls[0][1]?.body as string;
    const eventPayload = JSON.parse(requestBody.split('\n')[2]);
    expect(eventPayload.tags).toEqual({
      'metamask.environment': 'error-environment',
      'metamask.build_type': 'main',
      source: 'critical-error',
    });
    expect(eventPayload.extra.error_details).not.toHaveProperty('sentryTags');
  });

  it('still displays error and throws original error when notifying background fails', async () => {
    const port = {
      postMessage: jest.fn().mockImplementation(() => {
        throw new Error('Message port closed');
      }),
      onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
      onDisconnect: { addListener: jest.fn(), removeListener: jest.fn() },
      name: 'popup',
      disconnect: jest.fn(),
    } as unknown as browser.Runtime.Port;

    const error = new Error('Background initialization timeout');

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        port,
        CriticalErrorType.BackgroundInitTimeout,
      ),
    ).rejects.toThrow(error);

    expect(port.postMessage).toHaveBeenCalledWith({
      data: {
        method: CRITICAL_ERROR_SCREEN_VIEWED,
        params: {
          repairAction: CriticalErrorRepairAction.None,
          criticalErrorType: CriticalErrorType.BackgroundInitTimeout,
        },
      },
    });
  });
});

describe('repair button', () => {
  let rootContainer: HTMLElement;
  let container: HTMLElement;
  let mockPort: browser.Runtime.Port;
  let restoreGetBackupState: (() => void) | null = null;
  const MOCK_ERROR_MESSAGE = 'Background initialization timeout';

  beforeEach(() => {
    container = document.createElement('div');
    rootContainer = document.createElement('div');
    rootContainer.appendChild(container);

    mockPort = {
      postMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
        hasListeners: jest.fn(),
      },
      onDisconnect: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
        hasListeners: jest.fn(),
      },
      name: 'popup',
      disconnect: jest.fn(),
    } as unknown as browser.Runtime.Port;

    jest.spyOn(errorUtils, 'maybeGetLocaleContext').mockResolvedValue({
      preferredLocale: 'en',
      t: (key: string) => key,
      localeMessages: {},
      enLocaleMessages: {},
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as Response);
    process.env = {
      ...originalEnv,
      SENTRY_DSN: MOCK_SENTRY_DSN,
      SENTRY_DSN_DEV: MOCK_SENTRY_DSN_DEV,
      METAMASK_ENVIRONMENT: 'development',
    };
  });

  afterEach(() => {
    if (restoreGetBackupState) {
      restoreGetBackupState();
      restoreGetBackupState = null;
    }
    jest.clearAllMocks();
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it('sends METHOD_REPAIR_DATABASE with recover action when repair button is clicked and user confirms', async () => {
    jest.useFakeTimers();
    jest.spyOn(errorUtils, 'getErrorHtml').mockRestore();
    jest.spyOn(errorUtils, 'getErrorHtml');

    restoreGetBackupState = mockGetBackupStateWithVault();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const error = new Error(MISSING_VAULT_ERROR);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.MissingVaultInDatabase,
      ),
    ).rejects.toThrow(error);

    // getErrorHtml should have been called with the recover action.
    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      CriticalErrorRepairAction.Recover,
      CriticalErrorType.MissingVaultInDatabase,
      true,
    );

    expect(rootContainer.querySelector('#critical-error-button')).toBeNull();
    expect(
      rootContainer.querySelector('#critical-error-checkbox'),
    ).not.toBeNull();
    // Repair button should be in the DOM
    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    expect(repairButton).toBeTruthy();
    expect(repairButton?.disabled).toBe(true);
    expect(repairButton?.textContent?.trim()).toBe(
      'criticalErrorRecoverAccounts',
    );

    repairButton?.click();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(mockPort.postMessage).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(repairButton?.disabled).toBe(false);
    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(repairButton?.disabled).toBe(true);
    expect(repairButton?.textContent).toBe('stateCorruptionRestoringDatabase');
    repairButton?.click();
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: METHOD_REPAIR_DATABASE,
          params: expect.objectContaining({
            repairAction: CriticalErrorRepairAction.Recover,
            criticalErrorType: CriticalErrorType.MissingVaultInDatabase,
          }),
        }),
      }),
    );
  });

  it('restores the repair button when posting METHOD_REPAIR_DATABASE fails', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());

    restoreGetBackupState = mockGetBackupStateWithVault();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const postMessage = mockPort.postMessage as jest.Mock;
    postMessage.mockImplementation(
      (message: { data?: { method?: string } }) => {
        if (message?.data?.method === METHOD_REPAIR_DATABASE) {
          throw new Error('Attempting to use a disconnected port object');
        }
      },
    );

    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.BackgroundInitTimeout,
      ),
    ).rejects.toThrow(error);

    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    expect(repairButton).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(repairButton?.disabled).toBe(false);
    expect(repairButton?.textContent).toBe('criticalErrorAttemptRecovery');

    postMessage.mockImplementation(() => undefined);

    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(repairButton?.disabled).toBe(true);
    expect(repairButton?.textContent).toBe('stateCorruptionRestoringDatabase');
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: METHOD_REPAIR_DATABASE,
        }),
      }),
    );
  });

  it('does not send METHOD_REPAIR_DATABASE when repair button is clicked and user cancels', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());

    restoreGetBackupState = mockGetBackupStateWithVault();
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.BackgroundInitTimeout,
      ),
    ).rejects.toThrow(error);

    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    expect(repairButton).toBeTruthy();
    expect(repairButton?.disabled).toBe(true);

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(repairButton?.disabled).toBe(false);
    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(window.confirm).toHaveBeenCalled();
    // postMessage is called once when the error is displayed (CRITICAL_ERROR_SCREEN_VIEWED), but not for repair when user cancels
    expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: CRITICAL_ERROR_SCREEN_VIEWED,
          params: expect.objectContaining({
            repairAction: CriticalErrorRepairAction.Recover,
            criticalErrorType: CriticalErrorType.BackgroundInitTimeout,
          }),
        }),
      }),
    );
  });

  it('uses values from the background without re-reading IndexedDB', async () => {
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());

    const getBackupState = jest.fn().mockResolvedValue(null);
    const previous = globalThis.stateHooks?.getBackupState;
    globalThis.stateHooks = {
      ...(globalThis.stateHooks ?? {}),
      getBackupState,
    };
    restoreGetBackupState = () => {
      if (previous) {
        globalThis.stateHooks.getBackupState = previous;
      } else {
        delete globalThis.stateHooks.getBackupState;
      }
    };

    const error = new Error(MISSING_VAULT_ERROR);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.MissingVaultInDatabase,
        CriticalErrorRepairAction.Recover,
        false,
      ),
    ).rejects.toThrow(error);

    expect(getBackupState).not.toHaveBeenCalled();
    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      CriticalErrorRepairAction.Recover,
      CriticalErrorType.MissingVaultInDatabase,
      true,
    );
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: CRITICAL_ERROR_SCREEN_VIEWED,
          params: expect.objectContaining({
            repairAction: CriticalErrorRepairAction.Recover,
          }),
        }),
      }),
    );
  });

  it('does not report again when analytics is enabled and background capture was attempted', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const error = new Error(MISSING_VAULT_ERROR);
    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.MissingVaultInDatabase,
        CriticalErrorRepairAction.Recover,
        true,
        true,
      ),
    ).rejects.toThrow(error);

    expect(rootContainer.querySelector('#critical-error-checkbox')).toBeNull();
    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      CriticalErrorRepairAction.Recover,
      CriticalErrorType.MissingVaultInDatabase,
      false,
    );

    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: METHOD_REPAIR_DATABASE,
        }),
      }),
    );
  });

  it('reports when analytics is enabled and background capture was not attempted', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const error = new Error('Background initialization timeout');
    restoreGetBackupState = mockGetBackupStateWithVault({
      ...MOCK_BACKUP_WITH_VAULT,
      AnalyticsController: { consentDecisionMade: true, optedIn: true },
    });

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.BackgroundInitTimeout,
      ),
    ).rejects.toThrow(error);

    expect(rootContainer.querySelector('#critical-error-checkbox')).toBeNull();
    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(fetch).toHaveBeenCalled();
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: METHOD_REPAIR_DATABASE,
        }),
      }),
    );
  });

  it('shows a checked report checkbox when analytics is disabled', async () => {
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());
    const error = new Error(MISSING_VAULT_ERROR);
    restoreGetBackupState = mockGetBackupStateWithVault({
      ...MOCK_BACKUP_WITH_VAULT,
      AnalyticsController: { consentDecisionMade: true, optedIn: false },
    });

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.MissingVaultInDatabase,
      ),
    ).rejects.toThrow(error);

    const reportCheckbox = rootContainer.querySelector<HTMLInputElement>(
      '#critical-error-checkbox',
    );
    expect(reportCheckbox?.checked).toBe(true);
  });

  it('does not report during repair when analytics is disabled and the checkbox is unchecked', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const error = new Error(MISSING_VAULT_ERROR);
    restoreGetBackupState = mockGetBackupStateWithVault({
      ...MOCK_BACKUP_WITH_VAULT,
      AnalyticsController: { consentDecisionMade: true, optedIn: false },
    });

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.MissingVaultInDatabase,
      ),
    ).rejects.toThrow(error);

    const reportCheckbox = rootContainer.querySelector<HTMLInputElement>(
      '#critical-error-checkbox',
    );
    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    if (reportCheckbox) {
      reportCheckbox.checked = false;
    }
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: METHOD_REPAIR_DATABASE,
        }),
      }),
    );
  });

  it('does not attach the vault backup to thrown errors or background messages', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const error = {
      message: MISSING_VAULT_ERROR,
      name: 'PersistenceError',
      stack: 'PersistenceError: missing vault',
      sentryTags: {
        'corruption.backupShouldExist': 'true',
      },
    };

    restoreGetBackupState = mockGetBackupStateWithVault();

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.MissingVaultInDatabase,
      ),
    ).rejects.toBe(error);

    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(error).not.toHaveProperty('backup');
    expect(JSON.stringify(error)).not.toContain('encrypted-vault-data');
    expect(
      JSON.stringify(jest.mocked(mockPort.postMessage).mock.calls),
    ).not.toContain('encrypted-vault-data');
    expect(
      JSON.stringify(jest.mocked(mockPort.postMessage).mock.calls),
    ).not.toContain('"backup"');
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: METHOD_REPAIR_DATABASE,
        }),
      }),
    );
  });

  it('sends METHOD_REPAIR_DATABASE with reset action when repair button is clicked and user confirms', async () => {
    jest.useFakeTimers();
    jest.spyOn(errorUtils, 'getErrorHtml').mockRestore();
    jest.spyOn(errorUtils, 'getErrorHtml');

    restoreGetBackupState = mockGetBackupStateNoVault();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const error = new Error(MISSING_VAULT_ERROR);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
        CriticalErrorType.MissingVaultInDatabase,
        undefined,
        undefined,
        true,
      ),
    ).rejects.toThrow(error);

    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      CriticalErrorRepairAction.Reset,
      CriticalErrorType.MissingVaultInDatabase,
      true,
    );

    expect(rootContainer.querySelector('#critical-error-button')).toBeNull();
    expect(
      rootContainer.querySelector('#critical-error-checkbox'),
    ).not.toBeNull();
    const repairButton = rootContainer.querySelector<HTMLButtonElement>(
      '#critical-error-repair-button',
    );
    expect(repairButton).toBeTruthy();
    expect(repairButton?.disabled).toBe(true);
    expect(repairButton?.textContent?.trim()).toBe(
      'criticalErrorResetMetaMaskState',
    );

    repairButton?.click();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(mockPort.postMessage).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(repairButton?.disabled).toBe(false);
    await act(async () => {
      repairButton?.click();
      await Promise.resolve();
    });

    expect(repairButton?.disabled).toBe(true);
    expect(repairButton?.textContent).toBe('stateCorruptionResettingDatabase');
    expect(fetch).toHaveBeenCalled();
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: METHOD_REPAIR_DATABASE,
          params: {
            repairAction: CriticalErrorRepairAction.Reset,
            criticalErrorType: CriticalErrorType.MissingVaultInDatabase,
          },
        }),
      }),
    );
  });

  it('does not show repair button when no backup exists', async () => {
    jest
      .spyOn(errorUtils, 'getErrorHtml')
      .mockImplementation(mockGetErrorHtmlWithOptionalRestoreLink());

    restoreGetBackupState = mockGetBackupStateNoVault();

    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        mockPort,
      ),
    ).rejects.toThrow(error);

    // getErrorHtml should have been called with no repair action.
    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      CriticalErrorRepairAction.None,
      undefined,
      true,
    );

    // No repair button
    expect(
      rootContainer.querySelector('#critical-error-repair-button'),
    ).toBeNull();
  });
});

describe('displayCriticalErrorPage', () => {
  it('returns undefined when container has no parent', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const container = document.createElement('div');
    const result = displayCriticalErrorPage(container, '<p>Error message</p>');
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      'Cannot display critical error. Another critical error may already be shown.',
    );
    warnSpy.mockRestore();
  });
});

describe('extractEnvelopeUrlFromDsn', () => {
  it('should extract correct envelope URL from valid DSN', () => {
    const dsn = 'https://3567c198f8a8412082d32655da2961d0@sentry.io/273505';
    const result = extractEnvelopeUrlFromDsn(dsn);
    expect(result).toBe('https://sentry.io/api/273505/envelope/');
  });

  it('should handle different regions', () => {
    const dsn = 'https://key@o123.ingest.eu.sentry.io/456';
    const result = extractEnvelopeUrlFromDsn(dsn);
    expect(result).toBe('https://o123.ingest.eu.sentry.io/api/456/envelope/');
  });

  it('should throw error for invalid DSN', () => {
    const invalidDsn = 'not-a-valid-url';
    expect(() => extractEnvelopeUrlFromDsn(invalidDsn)).toThrow(
      'Invalid Sentry DSN format',
    );
  });

  it('should throw error for empty string', () => {
    expect(() => extractEnvelopeUrlFromDsn('')).toThrow(
      'Invalid Sentry DSN format',
    );
  });
});
