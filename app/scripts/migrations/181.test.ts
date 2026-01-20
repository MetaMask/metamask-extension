import { migrate, version } from './181';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #180', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 180 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('removes showIncomingTransactions from PreferencesController', async () => {
    const oldStorage = {
      meta: { version: 180 },
      data: {
        PreferencesController: {
          showIncomingTransactions: {
            '0x1': true,
            '0x5': true,
            '0x89': true,
          },
          selectedAddress: '0x123',
          identities: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.PreferencesController).toStrictEqual({
      selectedAddress: '0x123',
      identities: {},
    });
  });

  it('does nothing if PreferencesController is not in state', async () => {
    const oldStorage = {
      meta: { version: 180 },
      data: {
        OtherController: {
          someProperty: 'value',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if showIncomingTransactions does not exist', async () => {
    const oldStorage = {
      meta: { version: 180 },
      data: {
        PreferencesController: {
          selectedAddress: '0x123',
          identities: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
