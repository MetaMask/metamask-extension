import * as Sentry from '@sentry/browser';
import setupSentry from './setupSentry';

jest.mock('@sentry/browser', () => {
  const actual = jest.requireActual('@sentry/browser');
  return {
    ...actual,
    init: jest.fn(),
    browserTracingIntegration: jest.fn(actual.browserTracingIntegration),
  };
});

describe('setupSentry pageload', () => {
  const globals = globalThis as { ServiceWorkerGlobalScope?: unknown };
  const browserTracing = Sentry.browserTracingIntegration as jest.Mock;

  beforeEach(() => {
    browserTracing.mockClear();
  });

  afterEach(() => {
    delete globals.ServiceWorkerGlobalScope;
  });

  function instrumentPageLoad() {
    setupSentry();
    return browserTracing.mock.calls[0][0].instrumentPageLoad;
  }

  it('emits a pageload in a document', () => {
    expect(instrumentPageLoad()).toBe(true);
  });

  it('emits no pageload in the service worker', () => {
    globals.ServiceWorkerGlobalScope = class {
      static [Symbol.hasInstance](instance: unknown) {
        return instance === globalThis;
      }
    };

    expect(instrumentPageLoad()).toBe(false);
  });
});
