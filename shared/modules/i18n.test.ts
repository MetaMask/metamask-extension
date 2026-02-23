import type { I18NMessageDict } from './i18n.js';

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
  let fallbackLocale: string;
  let getMessage: typeof import('./i18n.js').getMessage;
  let fetchLocale: typeof import('./i18n.js').fetchLocale;
  let loadRelativeTimeFormatLocaleData: typeof import('./i18n.js').loadRelativeTimeFormatLocaleData;
  let logMock: { warn: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    jest.resetModules();
    jest.resetAllMocks();
    process.env.IN_TEST = 'true';
    const loglevelModule = await import('loglevel');
    logMock = (loglevelModule.default ?? loglevelModule) as unknown as {
      warn: jest.Mock;
      error: jest.Mock;
    };
    const i18nModulePath = './i18n';
    const i18nModule = (await import(
      i18nModulePath
    )) as typeof import('./i18n.js');
    fallbackLocale = i18nModule.FALLBACK_LOCALE;
    getMessage = i18nModule.getMessage;
    fetchLocale = i18nModule.fetchLocale;
    loadRelativeTimeFormatLocaleData =
      i18nModule.loadRelativeTimeFormatLocaleData;
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

            expect(logMock.warn).toHaveBeenCalledTimes(1);
            expect(logMock.warn).toHaveBeenCalledWith(
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

            expect(logMock.warn).toHaveBeenCalledTimes(1);
            expect(logMock.warn).toHaveBeenCalledWith(
              `Translator - Unable to find value of key "${keyMock}" for locale "${localeCodeMock}"`,
            );
          });
        });

        describe('if using fallback locale', () => {
          it('logs error', () => {
            delete process.env.IN_TEST;

            expect(
              getMessage(
                fallbackLocale,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toBeNull();

            expect(logMock.error).toHaveBeenCalledTimes(1);
            expect(logMock.error).toHaveBeenCalledWith(
              new Error(
                `Unable to find value of key "${keyMock}" for locale "${fallbackLocale}"`,
              ),
            );
          });

          it('throws if IN_TEST is set true', () => {
            expect(() =>
              getMessage(
                fallbackLocale,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toThrow(
              `Unable to find value of key "${keyMock}" for locale "${fallbackLocale}"`,
            );
          });

          it('throws if ENABLE_SETTINGS_PAGE_DEV_OPTIONS is set true', () => {
            process.env.IN_TEST = String(false);
            process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS = String(true);
            expect(() =>
              getMessage(
                fallbackLocale,
                {} as unknown as I18NMessageDict,
                keyMock,
              ),
            ).toThrow(
              `Unable to find value of key "${keyMock}" for locale "${fallbackLocale}"`,
            );
          });

          it('calls onError callback', () => {
            const onErrorMock = jest.fn();

            try {
              getMessage(
                fallbackLocale,
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
                `Unable to find value of key "${keyMock}" for locale "${fallbackLocale}"`,
              ),
            );
          });

          it('does nothing if error already created', () => {
            const onErrorMock = jest.fn();

            try {
              getMessage(
                fallbackLocale,
                {} as unknown as I18NMessageDict,
                keyMock,
                [],
                onErrorMock,
              );
            } catch {
              // Expected
            }

            getMessage(
              fallbackLocale,
              {} as unknown as I18NMessageDict,
              keyMock,
              [],
              onErrorMock,
            );

            expect(logMock.error).toHaveBeenCalledTimes(1);
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

          expect(logMock.error).toHaveBeenCalledTimes(1);
          expect(logMock.error).toHaveBeenCalledWith(
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

          expect(logMock.error).toHaveBeenCalledTimes(1);
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
        url: `../_locales/${localeCodeMock}/messages.json`,
      });
    });

    it('logs if fetch fails', async () => {
      await fetchLocale(errorLocaleMock);

      expect(logMock.error).toHaveBeenCalledTimes(1);
      expect(logMock.error).toHaveBeenCalledWith(
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          __addLocaleData: addMock,
        },
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          __addLocaleData: addMock,
        },
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      await loadRelativeTimeFormatLocaleData(`${localeCodeMock}_test`);
      await loadRelativeTimeFormatLocaleData(`${localeCodeMock}_test`);

      expect(addMock).toHaveBeenCalledTimes(1);
    });
  });
});
