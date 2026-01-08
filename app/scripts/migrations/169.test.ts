import { migrate, version } from './169';

const oldVersion = 166;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('assigns AppStateControllerState `upgradeSplashPageAcknowledgedForAccounts` to preference smartAccountOptInForAccounts', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          AppStateController: {
            upgradeSplashPageAcknowledgedForAccounts: ['0xabc', '0xbcd'],
          },
          PreferencesController: {
            preferences: { smartAccountOptInForAccounts: [] },
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data.PreferencesController).toStrictEqual({
        preferences: { smartAccountOptInForAccounts: ['0xabc', '0xbcd'] },
      });
      expect(newStorage.data.AppStateController).toStrictEqual({});
    });

    it('does nothing if AppStateControllerState `upgradeSplashPageAcknowledgedForAccounts` is not defined', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          AppStateController: {},
          PreferencesController: {
            preferences: { smartAccountOptInForAccounts: [] },
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data.PreferencesController).toStrictEqual({
        preferences: { smartAccountOptInForAccounts: [] },
      });
    });
  });
});
