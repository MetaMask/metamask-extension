import { Span, startSpan, withIsolationScope } from '@sentry/browser';
import { trace } from './performance';

jest.mock('@sentry/browser', () => ({
  withIsolationScope: jest.fn(),
  startSpan: jest.fn(),
}));

const NAME_MOCK = 'testTransaction';
const PARENT_CONTEXT_MOCK = {} as Span;

const TAGS_MOCK = {
  tag1: 'value1',
  tag2: true,
  tag3: 123,
};

const DATA_MOCK = {
  data1: 'value1',
  data2: true,
  data3: 123,
};

function mockGetSentryEnabled(enabled: boolean) {
  global.sentry = {
    getSentryEnabled: () => Promise.resolve(enabled),
  };
}

describe('Performance', () => {
  const startSpanMock = jest.mocked(startSpan);
  const withIsolationScopeMock = jest.mocked(withIsolationScope);
  const setTagsMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    startSpanMock.mockImplementation((_, fn) => fn({} as Span));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withIsolationScopeMock.mockImplementation((fn: any) =>
      fn({ setTags: setTagsMock }),
    );
  });

  describe('trace', () => {
    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['enabled', true],
      ['disabled', false],
    ])(
      'executes callback if Sentry is %s',
      async (_: string, sentryEnabled: boolean) => {
        let callbackExecuted = false;

        mockGetSentryEnabled(sentryEnabled);

        await trace({ name: NAME_MOCK }, async () => {
          callbackExecuted = true;
        });

        expect(callbackExecuted).toBe(true);
      },
    );

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['enabled', true],
      ['disabled', false],
    ])(
      'returns value from callback if Sentry is %s',
      async (_: string, sentryEnabled: boolean) => {
        mockGetSentryEnabled(sentryEnabled);

        const result = await trace({ name: NAME_MOCK }, async () => {
          return true;
        });

        expect(result).toBe(true);
      },
    );

    it('invokes Sentry if enabled', async () => {
      mockGetSentryEnabled(true);

      await trace(
        {
          name: NAME_MOCK,
          tags: TAGS_MOCK,
          data: DATA_MOCK,
          parentContext: PARENT_CONTEXT_MOCK,
        },
        async () => Promise.resolve(),
      );

      expect(withIsolationScopeMock).toHaveBeenCalledTimes(1);

      expect(startSpanMock).toHaveBeenCalledTimes(1);
      expect(startSpanMock).toHaveBeenCalledWith(
        {
          name: NAME_MOCK,
          parentSpan: PARENT_CONTEXT_MOCK,
          attributes: DATA_MOCK,
        },
        expect.any(Function),
      );

      expect(setTagsMock).toHaveBeenCalledTimes(1);
      expect(setTagsMock).toHaveBeenCalledWith(TAGS_MOCK);
    });
  });
});
