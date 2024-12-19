import { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';
import { migrate, VersionedData } from './135';

const prevVersion = 134;

describe('migration #135', () => {
  const mockSmartTransaction: SmartTransaction = {
    uuid: 'test-uuid',
  };

  it('should update the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: prevVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version: 135 });
  });

  it('should set stx opt-in to true and migration flag when stx opt-in status is null', async () => {
    const oldStorage: VersionedData = {
      meta: { version: prevVersion },
      data: {
        PreferencesController: {
          preferences: {
            smartTransactionsOptInStatus: null,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsOptInStatus,
    ).toBe(true);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(true);
  });

  it('should set stx opt-in to true and migration flag when stx opt-in status is undefined', async () => {
    const oldStorage: VersionedData = {
      meta: { version: prevVersion },
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsOptInStatus,
    ).toBe(true);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(true);
  });

  it('should set stx opt-in to true and migration flag when stx opt-in is false and no existing mainnet smart transactions', async () => {
    const oldStorage: VersionedData = {
      meta: { version: prevVersion },
      data: {
        PreferencesController: {
          preferences: {
            smartTransactionsOptInStatus: false,
          },
        },
        SmartTransactionsController: {
          smartTransactionsState: {
            smartTransactions: {
              '0x1': [], // Empty mainnet transactions
              '0xAA36A7': [mockSmartTransaction], // Sepolia has transactions
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsOptInStatus,
    ).toBe(true);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(true);
  });

  it('should not change stx opt-in when stx opt-in is false but has existing smart transactions, but should set migration flag', async () => {
    const oldStorage: VersionedData = {
      meta: { version: prevVersion },
      data: {
        PreferencesController: {
          preferences: {
            smartTransactionsOptInStatus: false,
          },
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
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsOptInStatus,
    ).toBe(false);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(true);
  });

  it('should not change stx opt-in when stx opt-in is already true, but should set migration flag', async () => {
    const oldStorage: VersionedData = {
      meta: { version: prevVersion },
      data: {
        PreferencesController: {
          preferences: {
            smartTransactionsOptInStatus: true,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsOptInStatus,
    ).toBe(true);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(true);
  });

  it('should initialize preferences object if it does not exist', async () => {
    const oldStorage: VersionedData = {
      meta: { version: prevVersion },
      data: {
        PreferencesController: {
          preferences: {
            smartTransactionsOptInStatus: true,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.PreferencesController?.preferences).toBeDefined();
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(true);
  });

  it('should capture exception if PreferencesController state is invalid', async () => {
    const sentryCaptureExceptionMock = jest.fn();
    global.sentry = {
      captureException: sentryCaptureExceptionMock,
    };

    const oldStorage = {
      meta: { version: prevVersion },
      data: {
        PreferencesController: 'invalid',
      },
    } as unknown as VersionedData;

    await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error('Invalid PreferencesController state: string'),
    );
  });
});
