import log from 'loglevel';
import {
  FALLBACK_LOCALE,
  I18NMessageDict,
  clearCaches,
  fetchLocale,
  getMessage,
  loadRelativeTimeFormatLocaleData,
} from './i18n';

const localeCodeMock = 'te';
const keyMock = 'testKey';
const errorLocaleMock = 'testLocaleError';
const errorMock = 'TestError';

jest.mock('loglevel');

jest.mock('./fetch-with-timeout', () =>
  jest.fn(() => (url: string) => {
    return Promise.resolve({
      json: () => {
        if (url.includes(errorLocaleMock)) {
          throw new Error(errorMock);
        }

        return { url };
      },
    });
  }),
);

describe('I18N Module', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    clearCaches();
    process.env.IN_TEST = 'true';
  });

  describe('getMessage', () => {
    describe('on error', () => {
      it('returns null if no messages', () => {
        expect(
          getMessage(
            localeCodeMock,
            null as unknown as I18NMessageDict,
            keyMock,
          ),
        ).toBeNull();
      });

      describe('if missing key', () => {
        describe('if not using fallback locale', () => {
          it('logs warning', () => {
            expect(
              getMessage(
                localeCodeMock,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toBeNull();

            expect(log.warn).toHaveBeenCalledTimes(1);
            expect(log.warn).toHaveBeenCalledWith(
              `Translator - Unable to find value of key "${keyMock}" for locale "${localeCodeMock}"`,
            );
          });

          it('does not log warning if warning already created', () => {
            expect(
              getMessage(
                localeCodeMock,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toBeNull();

            expect(
              getMessage(
                localeCodeMock,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toBeNull();

            expect(log.warn).toHaveBeenCalledTimes(1);
            expect(log.warn).toHaveBeenCalledWith(
              `Translator - Unable to find value of key "${keyMock}" for locale "${localeCodeMock}"`,
            );
          });
        });

        describe('if using fallback locale', () => {
          it('logs error', () => {
            delete process.env.IN_TEST;

            expect(
              getMessage(
                FALLBACK_LOCALE,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toBeNull();

            expect(log.error).toHaveBeenCalledTimes(1);
            expect(log.error).toHaveBeenCalledWith(
              new Error(
                `Unable to find value of key "${keyMock}" for locale "${FALLBACK_LOCALE}"`,
              ),
            );
          });

          it('throws if test env set', () => {
            expect(() =>
              getMessage(
                FALLBACK_LOCALE,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toThrow(
              `Unable to find value of key "${keyMock}" for locale "${FALLBACK_LOCALE}"`,
            );
          });

          it('calls onError callback', () => {
            const onErrorMock = jest.fn();

            try {
              getMessage(
                FALLBACK_LOCALE,
                {} as unknown as I18NMessageDict,
                keyMock,
                [],
                onErrorMock,
              );
            } catch {
              // Expected
            }

            expect(onErrorMock).toHaveBeenCalledTimes(1);
            expect(onErrorMock).toHaveBeenCalledWith(
              new Error(
                `Unable to find value of key "${keyMock}" for locale "${FALLBACK_LOCALE}"`,
              ),
            );
          });

          it('does nothing if error already created', () => {
            const onErrorMock = jest.fn();

            try {
              getMessage(
                FALLBACK_LOCALE,
                {} as unknown as I18NMessageDict,
                keyMock,
                [],
                onErrorMock,
              );
            } catch {
              // Expected
            }

            getMessage(
              FALLBACK_LOCALE,
              {} as unknown as I18NMessageDict,
              keyMock,
              [],
              onErrorMock,
            );

            expect(log.error).toHaveBeenCalledTimes(1);
            expect(onErrorMock).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe('if missing substitution', () => {
        it('logs error', () => {
          expect(
            getMessage(
              localeCodeMock,
              { [keyMock]: { message: 'test1 $1 test2 $2 test3' } },
              keyMock,
              ['a1'],
            ),
          ).toStrictEqual('test1 a1 test2  test3');

          expect(log.error).toHaveBeenCalledTimes(1);
          expect(log.error).toHaveBeenCalledWith(
            new Error(
              `Insufficient number of substitutions for key "${keyMock}" with locale "${localeCodeMock}"`,
            ),
          );
        });

        it('calls onError callback', () => {
          const onErrorMock = jest.fn();

          expect(
            getMessage(
              localeCodeMock,
              { [keyMock]: { message: 'test1 $1 test2 $2 test3' } },
              keyMock,
              ['a1'],
              onErrorMock,
            ),
          ).toStrictEqual('test1 a1 test2  test3');

          expect(onErrorMock).toHaveBeenCalledTimes(1);
          expect(onErrorMock).toHaveBeenCalledWith(
            new Error(
              `Insufficient number of substitutions for key "${keyMock}" with locale "${localeCodeMock}"`,
            ),
          );
        });

        it('does nothing if error already created', () => {
          const onErrorMock = jest.fn();

          expect(
            getMessage(
              localeCodeMock,
              { [keyMock]: { message: 'test1 $1 test2 $2 test3' } },
              keyMock,
              ['a1'],
              onErrorMock,
            ),
          ).toStrictEqual('test1 a1 test2  test3');

          expect(
            getMessage(
              localeCodeMock,
              { [keyMock]: { message: 'test1 $1 test2 $2 test3' } },
              keyMock,
              ['a1'],
              onErrorMock,
            ),
          ).toStrictEqual('test1 a1 test2  test3');

          expect(log.error).toHaveBeenCalledTimes(1);
          expect(onErrorMock).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('returns text only if no substitutions', () => {
      expect(
        getMessage(
          localeCodeMock,
          { [keyMock]: { message: 'testValue' } },
          keyMock,
        ),
      ).toStrictEqual('testValue');
    });

    it('returns text including substitutions', () => {
      expect(
        getMessage(
          localeCodeMock,
          { [keyMock]: { message: 'test1 $1 test2 $2 test3' } },
          keyMock,
          ['a1', 'b2'],
        ),
      ).toStrictEqual('test1 a1 test2 b2 test3');
    });

    it('returns text including substitutions using custom join', () => {
      expect(
        getMessage(
          localeCodeMock,
          { [keyMock]: { message: 'test1 $1 test2 $2 test3' } },
          keyMock,
          ['a1', 'b2'],
          undefined,
          (substitutions) => substitutions.join(','),
        ),
      ).toStrictEqual('test1 ,a1, test2 ,b2, test3');
    });
  });

  describe('fetchLocale', () => {
    it('returns json from locale file', async () => {
      const result = await fetchLocale(localeCodeMock);
      expect(result).toStrictEqual({
        url: `./_locales/${localeCodeMock}/messages.json`,
      });
    });

    it('logs if fetch fails', async () => {
      await fetchLocale(errorLocaleMock);

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalledWith(
        `failed to fetch testLocaleError locale because of Error: ${errorMock}`,
      );
    });

    it('returns empty object if fetch fails', async () => {
      expect(await fetchLocale(errorLocaleMock)).toStrictEqual({});
    });
  });

  describe('loadRelativeTimeFormatLocaleData', () => {
    it('adds locale data if function exists', async () => {
      const addMock = jest.fn();

      global.Intl = {
        RelativeTimeFormat: {
          __addLocaleData: addMock,
        },
      } as any;

      await loadRelativeTimeFormatLocaleData(`${localeCodeMock}_test`);

      expect(addMock).toHaveBeenCalledTimes(1);
      expect(addMock).toHaveBeenCalledWith({
        url: `./intl/${localeCodeMock}/relative-time-format-data.json`,
      });
    });

    it('does not add locale data if language tag already processed', async () => {
      const addMock = jest.fn();

      global.Intl = {
        RelativeTimeFormat: {
          __addLocaleData: addMock,
        },
      } as any;

      await loadRelativeTimeFormatLocaleData(`${localeCodeMock}_test`);
      await loadRelativeTimeFormatLocaleData(`${localeCodeMock}_test`);

      expect(addMock).toHaveBeenCalledTimes(1);
    });
  });
});
