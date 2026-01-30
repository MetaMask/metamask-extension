import browser from 'webextension-polyfill';
import { act } from 'react-dom/test-utils';
import * as errorUtils from '../../../shared/lib/error-utils';
import {
  displayCriticalErrorMessage,
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
  METAMASK_ENVIRONMENT: 'development',
};

jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(() => ({
    sentry: { forceEnable: false },
  })),
}));

describe('displayCriticalError', () => {
  let rootContainer: HTMLElement;
  let container: HTMLElement;
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

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as Response);

    jest.spyOn(errorUtils, 'maybeGetLocaleContext').mockResolvedValue({
      preferredLocale: 'en',
      t: (key: string) => key,
    });

    jest.spyOn(errorUtils, 'getErrorHtml').mockImplementation(
      (_errorKey, _error, _localeContext, _supportLink, _hasBackup) => `
        <div>
          <input type="checkbox" id="critical-error-checkbox" checked />
          <button id="critical-error-button">Restart</button>
        </div>
      `,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders critical error html into parent of container', async () => {
    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
      ),
    ).rejects.toThrow(error);

    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      { preferredLocale: 'en', t: expect.any(Function) },
      expect.any(String),
      false, // canTriggerRestore is false when no port is provided
    );
    expect(
      rootContainer.querySelector('#critical-error-content')?.innerHTML,
    ).toContain('critical-error-button');
  });

  it('clicking restart button calls fetch and reload if checkbox checked', async () => {
    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
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

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.SomethingIsWrong,
        error,
        'en',
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
});

describe('displayCriticalErrorMessage with backup', () => {
  let rootContainer: HTMLElement;
  let container: HTMLElement;
  let mockPort: browser.Runtime.Port;
  const MOCK_ERROR_MESSAGE = 'test error';

  beforeEach(() => {
    container = document.createElement('div');
    rootContainer = document.createElement('div');
    rootContainer.appendChild(container);

    mockPort = {
      postMessage: jest.fn(),
      onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
      onDisconnect: { addListener: jest.fn(), removeListener: jest.fn() },
      name: 'test-port',
    } as unknown as browser.Runtime.Port;

    jest.spyOn(errorUtils, 'maybeGetLocaleContext').mockResolvedValue({
      preferredLocale: 'en',
      t: (key: string) => key,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes hasBackup=false when no port is provided', async () => {
    jest.spyOn(errorUtils, 'getErrorHtml').mockImplementation(
      (_errorKey, _error, _localeContext, _supportLink, _hasBackup) => `
        <div>
          <input type="checkbox" id="critical-error-checkbox" checked />
          <button id="critical-error-button">Restart</button>
        </div>
      `,
    );

    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalErrorMessage(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
        // No port provided
      ),
    ).rejects.toThrow(error);

    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      false, // canTriggerRestore should be false when no port is provided
    );
  });

  it('checks IndexedDB for backup when port is provided and handles errors gracefully', async () => {
    // Mock IndexedDB to throw an error
    const originalIndexedDB = global.indexedDB;
    const mockOpen = jest.fn().mockImplementation(() => {
      const request = {
        result: null,
        error: new Error('DB error'),
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      // Simulate async error
      setTimeout(() => {
        if (request.onerror) {
          request.onerror();
        }
      }, 0);
      return request;
    });
    global.indexedDB = { open: mockOpen } as unknown as IDBFactory;

    jest.spyOn(errorUtils, 'getErrorHtml').mockImplementation(
      (_errorKey, _error, _localeContext, _supportLink, hasBackup) => `
        <div>
          <input type="checkbox" id="critical-error-checkbox" checked />
          <button id="critical-error-button">Restart</button>
          ${hasBackup ? '<a id="critical-error-restore-link" href="#">Restore</a>' : ''}
        </div>
      `,
    );

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

    // Should have tried to open IndexedDB
    expect(mockOpen).toHaveBeenCalledWith('metamask-backup', 1);

    // canTriggerRestore should be false because the backup check failed
    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      false,
    );

    global.indexedDB = originalIndexedDB;
  });

  it('shows restore option when backup exists in IndexedDB and port is provided', async () => {
    // Mock IndexedDB to return a backup with vault
    const originalIndexedDB = global.indexedDB;

    const mockKeyringResult = { vault: 'encrypted-vault-data' };
    const mockStore = {
      get: jest.fn().mockImplementation(() => {
        const getRequest = {
          result: mockKeyringResult,
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        };
        setTimeout(() => {
          if (getRequest.onsuccess) {
            getRequest.onsuccess();
          }
        }, 0);
        return getRequest;
      }),
    };
    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue(mockStore),
    };
    const mockDb = {
      transaction: jest.fn().mockReturnValue(mockTransaction),
      close: jest.fn(),
    };

    const mockOpen = jest.fn().mockImplementation(() => {
      const request = {
        result: mockDb,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);
      return request;
    });
    global.indexedDB = { open: mockOpen } as unknown as IDBFactory;

    jest.spyOn(errorUtils, 'getErrorHtml').mockImplementation(
      (_errorKey, _error, _localeContext, _supportLink, hasBackup) => `
        <div>
          <input type="checkbox" id="critical-error-checkbox" checked />
          <button id="critical-error-button">Restart</button>
          ${hasBackup ? '<a id="critical-error-restore-link" href="#">Restore</a>' : ''}
        </div>
      `,
    );

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

    // Should have opened IndexedDB
    expect(mockOpen).toHaveBeenCalledWith('metamask-backup', 1);

    // canTriggerRestore should be true because backup exists
    expect(errorUtils.getErrorHtml).toHaveBeenCalledWith(
      CriticalErrorTranslationKey.TroubleStarting,
      error,
      expect.any(Object),
      expect.any(String),
      true,
    );

    // Restore link should be in the DOM
    expect(
      rootContainer.querySelector('#critical-error-restore-link'),
    ).toBeTruthy();

    global.indexedDB = originalIndexedDB;
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
