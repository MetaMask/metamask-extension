import { runInNewContext } from 'node:vm';
import * as Sentry from '@sentry/browser';
import type { Event as SentryEvent } from '@sentry/core';

function createForeignError(source: string): Error {
  return runInNewContext(source) as unknown as Error;
}

describe('Sentry cross-realm error handling', () => {
  let capturedEvents: SentryEvent[];
  let originalFetchDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    await Sentry.close(2000);
    capturedEvents = [];
    originalFetchDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'fetch',
    );

    Sentry.init({
      beforeSend: (event) => {
        capturedEvents.push(event);
        return null;
      },
      defaultIntegrations: false,
      dsn: 'https://public@example.ingest.sentry.io/1',
      integrations: [Sentry.linkedErrorsIntegration()],
      skipBrowserExtensionCheck: true,
      transport: () => ({
        flush: async () => true,
        send: async () => ({}),
      }),
    });
  });

  afterEach(async () => {
    await Sentry.close(2000);
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }
  });

  it('preserves a cause chain created in another realm', async () => {
    const foreignError = createForeignError(
      `new Error('outer', { cause: new Error('inner') })`,
    );
    expect(foreignError).not.toBeInstanceOf(Error);

    Sentry.captureException(foreignError);
    await Sentry.flush(2000);

    expect(
      capturedEvents[0].exception?.values?.map(({ value }) => value),
    ).toStrictEqual(['inner', 'outer']);
  });

  it('preserves aggregate errors created in another realm', async () => {
    const foreignError = createForeignError(
      `new AggregateError([new Error('child')], 'parent')`,
    );
    expect(foreignError).not.toBeInstanceOf(Error);

    Sentry.captureException(foreignError);
    await Sentry.flush(2000);

    expect(
      capturedEvents[0].exception?.values?.map(({ value }) => value),
    ).toStrictEqual(['child', 'parent']);
  });

  it('recognizes an error property created in another realm', async () => {
    const foreignError = createForeignError(`new Error('nested')`);
    expect(foreignError).not.toBeInstanceOf(Error);

    Sentry.captureException({ error: foreignError });
    await Sentry.flush(2000);

    expect(capturedEvents[0].exception?.values?.[0].value).toBe('nested');
  });

  it('enhances a browser-style fetch TypeError created in another realm', async () => {
    const foreignError = createForeignError(
      `new TypeError('Failed to fetch')`,
    );
    expect(foreignError).not.toBeInstanceOf(TypeError);
    const fetchMock = jest.fn().mockRejectedValue(foreignError);
    globalThis.fetch = fetchMock;
    jest.resetModules();
    const { addFetchInstrumentationHandler } = await import('@sentry/core');
    addFetchInstrumentationHandler(() => undefined);
    expect(globalThis.fetch).not.toBe(fetchMock);

    await expect(globalThis.fetch('https://example.test/path')).rejects.toBe(
      foreignError,
    );

    expect(foreignError.message).toBe('Failed to fetch (example.test)');
  });
});
