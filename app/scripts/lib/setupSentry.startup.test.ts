export {};

const mockInternalLog = jest.fn();
const mockSentryLogger = Object.assign(jest.fn(), {
  extend: jest.fn(() => mockInternalLog),
});

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
  sentryLogger: mockSentryLogger,
}));

jest.mock('@sentry/core', () => {
  const actual = jest.requireActual('@sentry/core');
  const publicLogger = Object.create(
    null,
    Object.getOwnPropertyDescriptors(actual.logger),
  );
  const publicLog = jest.fn();
  const publicError = jest.fn();

  Object.defineProperties(publicLogger, {
    log: { get: () => publicLog, enumerable: true },
    error: { get: () => publicError, enumerable: true },
  });

  return { ...actual, logger: publicLogger };
});

jest.mock('@sentry/browser', () => ({
  ...jest.requireActual('@sentry/browser'),
  getClient: jest.fn(() => undefined),
  init: jest.fn(),
  registerSpanErrorInstrumentation: jest.fn(),
}));

jest.mock('./install-type', () => ({
  ...jest.requireActual('./install-type'),
  initInstallType: jest.fn(),
}));

jest.mock('../../../shared/lib/sentry-remote-rates', () => ({
  ...jest.requireActual('../../../shared/lib/sentry-remote-rates'),
  applySentryRemoteRates: jest.fn().mockResolvedValue({}),
}));

describe('setupSentry startup logging', () => {
  const originalDebug = process.env.METAMASK_DEBUG;
  const originalInTest = process.env.IN_TEST;

  afterEach(() => {
    if (originalDebug === undefined) {
      delete process.env.METAMASK_DEBUG;
    } else {
      process.env.METAMASK_DEBUG = originalDebug;
    }
    if (originalInTest === undefined) {
      delete process.env.IN_TEST;
    } else {
      process.env.IN_TEST = originalInTest;
    }
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('initializes with debug logging without changing the public logger', () => {
    process.env.METAMASK_DEBUG = 'true';
    process.env.IN_TEST = 'true';

    jest.isolateModules(() => {
      const { default: setupSentry } = jest.requireActual(
        './setupSentry',
      ) as typeof import('./setupSentry');
      const { debug, logger } = jest.requireMock('@sentry/core') as {
        debug: {
          log: (...args: unknown[]) => void;
          error: (...args: unknown[]) => void;
        };
        logger: {
          log: (...args: unknown[]) => void;
          error: (...args: unknown[]) => void;
        };
      };
      const { init } = jest.requireMock('@sentry/browser') as {
        init: jest.Mock;
      };
      const originalLog = debug.log;
      const originalError = debug.error;
      const publicLog = logger.log;
      const publicError = logger.error;
      const logDescriptor = Object.getOwnPropertyDescriptor(logger, 'log');
      const errorDescriptor = Object.getOwnPropertyDescriptor(logger, 'error');

      try {
        expect(logDescriptor?.get).toEqual(expect.any(Function));
        expect(logDescriptor?.set).toBeUndefined();
        expect(errorDescriptor?.get).toEqual(expect.any(Function));
        expect(errorDescriptor?.set).toBeUndefined();

        expect(setupSentry()).toBeDefined();
        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledWith(
          expect.objectContaining({ debug: true }),
        );
        expect(logger.log).toBe(publicLog);
        expect(logger.error).toBe(publicError);
        expect(Object.getOwnPropertyDescriptor(logger, 'log')).toStrictEqual(
          logDescriptor,
        );
        expect(Object.getOwnPropertyDescriptor(logger, 'error')).toStrictEqual(
          errorDescriptor,
        );

        const logDetails = { source: 'log' };
        const errorDetails = { source: 'error' };
        debug.log('Sentry Logger [log]: log message', logDetails);
        debug.error('Sentry Logger [error]: error message', errorDetails);

        expect(mockInternalLog.mock.calls.slice(-2)).toStrictEqual([
          ['log message', logDetails],
          ['error message', errorDetails],
        ]);
      } finally {
        debug.log = originalLog;
        debug.error = originalError;
      }
    });
  });
});
