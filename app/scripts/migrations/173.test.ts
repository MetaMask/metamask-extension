import { migrate, version } from './173';

const oldVersion = 172;

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
    it('removes AppStateControllerState `switchedNetworkNeverShowMessage` and `switchedNetworkDetails` properties', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          AppStateController: {
            lastUpdatedAt: 1717334400,
            switchedNetworkNeverShowMessage: false,
            switchedNetworkDetails: {},
            isUpdateAvailable: true,
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data.AppStateController).toStrictEqual({
        lastUpdatedAt: 1717334400,
        isUpdateAvailable: true,
      });
    });
  });
});
