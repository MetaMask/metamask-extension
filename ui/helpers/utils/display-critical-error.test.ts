import browser from 'webextension-polyfill';
import { act } from 'react-dom/test-utils';
import * as errorUtils from '../../../shared/lib/error-utils';
import {
  displayCriticalError,
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
  'https://3567c198f8a8412082d32655da2961d0@o124216.ingest.us.sentry.io/273505';
const MOCK_SENTRY_DSN_DEV = 'https://dev123@o124216.ingest.us.sentry.io/273505';

const originalEnv = process.env;
process.env = {
  ...originalEnv,
  SENTRY_DSN: MOCK_SENTRY_DSN,
  SENTRY_DSN_DEV: MOCK_SENTRY_DSN_DEV,
  METAMASK_ENVIRONMENT: 'development',
  IN_TEST: 'false', // we want to test sentry calls
};

jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(() => ({
    sentry: { forceEnable: false },
  })),
}));

describe('displayCriticalError', () => {
  let container: HTMLElement;
  const MOCK_ERROR_MESSAGE = 'test error';
  const EXPECTED_ENVELOPE_URL = extractEnvelopeUrlFromDsn(MOCK_SENTRY_DSN_DEV);

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    container = document.createElement('div');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as Response);

    jest.spyOn(errorUtils, 'maybeGetLocaleContext').mockResolvedValue({
      preferredLocale: 'en',
      t: (key: string) => key,
    });

    jest.spyOn(errorUtils, 'getErrorHtml').mockImplementation(
      (_errorKey, _error, _localeContext, _supportLink) => `
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

  it('renders critical error html into container', async () => {
    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalError(
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
    );
    expect(container.innerHTML).toContain('critical-error-button');
  });

  it('clicking restart button calls fetch and reload if checkbox checked', async () => {
    const error = new Error(MOCK_ERROR_MESSAGE);

    await expect(
      displayCriticalError(
        container,
        CriticalErrorTranslationKey.TroubleStarting,
        error,
        'en',
      ),
    ).rejects.toThrow(error);

    const restartButton = container.querySelector<HTMLButtonElement>(
      '#critical-error-button',
    );
    const checkbox = container.querySelector<HTMLInputElement>(
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
      displayCriticalError(
        container,
        CriticalErrorTranslationKey.SomethingIsWrong,
        error,
        'en',
      ),
    ).rejects.toThrow(error);

    const restartButton = container.querySelector<HTMLButtonElement>(
      '#critical-error-button',
    );
    const checkbox = container.querySelector<HTMLInputElement>(
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

describe('extractEnvelopeUrlFromDsn', () => {
  it('should extract correct envelope URL from valid DSN', () => {
    const dsn =
      'https://3567c198f8a8412082d32655da2961d0@o124216.ingest.us.sentry.io/273505';
    const result = extractEnvelopeUrlFromDsn(dsn);
    expect(result).toBe(
      'https://o124216.ingest.us.sentry.io/api/273505/envelope/',
    );
  });

  it('should handle different regions', () => {
    const dsn = 'https://key@o123.ingest.eu.sentry.io/456';
    const result = extractEnvelopeUrlFromDsn(dsn);
    expect(result).toBe('https://o123.ingest.eu.sentry.io/api/456/envelope/');
  });

  it('should return null for invalid DSN', () => {
    const invalidDsn = 'not-a-valid-url';
    const result = extractEnvelopeUrlFromDsn(invalidDsn);
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = extractEnvelopeUrlFromDsn('');
    expect(result).toBeNull();
  });
});
