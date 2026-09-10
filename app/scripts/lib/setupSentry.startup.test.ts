export {};

jest.mock('@sentry/core', () => {
  const actual =
    jest.requireActual<typeof import('@sentry/core')>('@sentry/core');
  return {
    ...actual,
    // The browser ESM export is a read-only module namespace. Jest's CJS
    // transform otherwise makes this API writable and hides startup failures.
    logger: Object.freeze({ ...actual.logger }),
    debug: { ...actual.debug },
  };
});

jest.mock('@sentry/browser', () => ({
  ...jest.requireActual<typeof import('@sentry/browser')>('@sentry/browser'),
  init: jest.fn(),
  getClient: jest.fn(),
  registerSpanErrorInstrumentation: jest.fn(),
}));

jest.mock('./install-type', () => ({ initInstallType: jest.fn() }));
jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: () => ({}),
}));
jest.mock('../../../shared/lib/sentry-remote-rates', () => ({
  applySentryRemoteRates: jest.fn().mockResolvedValue(undefined),
}));

describe('Sentry startup', () => {
  afterEach(() => jest.restoreAllMocks());

  it('initializes debug reporting without mutating the public logger namespace', () => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      METAMASK_DEBUG: 'true',
      METAMASK_ENVIRONMENT: 'development',
      SENTRY_DSN_DEV: 'https://fake@sentry.io/0000000',
    });

    jest.isolateModules(() => {
      const core =
        jest.requireMock<typeof import('@sentry/core')>('@sentry/core');
      const sentry =
        jest.requireMock<typeof import('@sentry/browser')>('@sentry/browser');
      const publicError = core.logger.error;
      const internalError = core.debug.error;
      const setupSentry =
        jest.requireActual<typeof import('./setupSentry')>(
          './setupSentry',
        ).default;

      expect(() => setupSentry()).not.toThrow();

      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ debug: 'true' }),
      );
      expect(core.logger.error).toBe(publicError);
      expect(core.debug.error).not.toBe(internalError);
    });
  });
});
