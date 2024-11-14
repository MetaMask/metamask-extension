import type { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';
import migration132, { type VersionedData } from './132';

describe('migration #132', () => {
  const mockSmartTransaction: SmartTransaction = {
    uuid: 'test-uuid',
    status: 'success',
    time: Date.now(),
    destinationTokenAddress: '0x456',
    destinationTokenDecimals: '18',
    destinationTokenSymbol: 'ETH',
    sourceTokenSymbol: 'USDC',
  };

  it('should update the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 131 },
      data: {},
    };

    const newStorage = await migration132.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version: 132 });
  });

  it('should set opt-in to true when status is null', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 131 },
      data: {
        PreferencesController: {
          smartTransactionsOptInStatus: null,
        },
      },
    };

    const newStorage = await migration132.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(true);
  });

  it('should set opt-in to true when status is undefined', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 131 },
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migration132.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(true);
  });

  it('should set opt-in to true when false and no existing transactions', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 131 },
      data: {
        PreferencesController: {
          smartTransactionsOptInStatus: false,
        },
        SmartTransactionsController: {
          smartTransactionsState: {
            smartTransactions: {},
          },
        },
      },
    };

    const newStorage = await migration132.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(true);
  });

  it('should not change opt-in when false but has existing transactions', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 131 },
      data: {
        PreferencesController: {
          smartTransactionsOptInStatus: false,
        },
        SmartTransactionsController: {
          smartTransactionsState: {
            smartTransactions: {
              '0x1': [mockSmartTransaction],
            },
          },
        },
      },
    };

    const newStorage = await migration132.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(false);
  });

  it('should not change opt-in when already true', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 131 },
      data: {
        PreferencesController: {
          smartTransactionsOptInStatus: true,
        },
      },
    };

    const newStorage = await migration132.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(true);
  });

  it('should capture exception if PreferencesController state is invalid', async () => {
    const sentryCaptureExceptionMock = jest.fn();
    global.sentry = {
      captureException: sentryCaptureExceptionMock,
    };

    const oldStorage = {
      meta: { version: 131 },
      data: {
        PreferencesController: 'invalid',
      },
    } as unknown as VersionedData;

    await migration132.migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error('Invalid PreferencesController state: string'),
    );
  });
});
