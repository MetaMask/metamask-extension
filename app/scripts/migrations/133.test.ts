import { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';
import { migrate, version } from './133';
import { VersionedData } from './133';

describe('migration #133', () => {
  const mockSmartTransaction: SmartTransaction = {
    uuid: 'test-uuid',
  };

  it('should update the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 132 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version: 133 });
  });

  it('should set stx opt-in to true when stx opt-in status is null', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 132 },
      data: {
        PreferencesController: {
          smartTransactionsOptInStatus: null,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(true);
  });

  it('should set stx opt-in to true when stx opt-in status is undefined', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 132 },
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(true);
  });

  it('should set stx opt-in to true when stx opt-in is false and no existing smart transactions', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 132 },
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

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(true);
  });

  it('should not change stx opt-in when stx opt-in is false but has existing smart transactions', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 132 },
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

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.smartTransactionsOptInStatus,
    ).toBe(false);
  });

  it('should not change stx opt-in when stx opt-in is already true', async () => {
    const oldStorage: VersionedData = {
      meta: { version: 132 },
      data: {
        PreferencesController: {
          smartTransactionsOptInStatus: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
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
      meta: { version: 132 },
      data: {
        PreferencesController: 'invalid',
      },
    } as unknown as VersionedData;

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error('Invalid PreferencesController state: string'),
    );
  });
});
