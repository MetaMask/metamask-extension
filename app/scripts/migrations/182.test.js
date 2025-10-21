import { migrate, version } from './182';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #182', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 181 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('only migrates accountsByChainId from AccountTracker', async () => {
    const oldStorage = {
      meta: { version: 181 },
      data: {
        AccountTracker: {
          accounts: {
            '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
              address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
              balance: '0x2',
            },
            '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
              address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
              balance: '0x6',
            },
          },
          accountsByChainId: {
            '0x1': {
              '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
                address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
                balance: '0x1',
              },
              '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
                address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
                balance: '0x3',
              },
            },
            '0xe708': {
              '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
                address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
                balance: '0x1',
              },
              '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
                address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
                balance: '0x3',
              },
            },
          },
          currentBlockGasLimit: '0x2adf998',
          currentBlockGasLimitByChainId: {
            '0xe708': '0x77359400',
            '0x1': '0x2adf998',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.AccountTracker).toStrictEqual({
      accountsByChainId: {
        '0x1': {
          '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B': { balance: '0x1' },
          '0x64A845a5b02460ACf8a3D84503b0D68d028B4bb4': { balance: '0x3' },
        },
        '0xe708': {
          '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B': { balance: '0x1' },
          '0x64A845a5b02460ACf8a3D84503b0D68d028B4bb4': { balance: '0x3' },
        },
      },
    });
  });

  it('does nothing if AccountTracker is not in state', async () => {
    const oldStorage = {
      meta: { version: 181 },
      data: {
        OtherController: {
          someProperty: 'value',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
