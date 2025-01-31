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

  it('should preserve existing state when opt-in status is null (default-enabled from previous versions)', async () => {
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
    ).toBe(null);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(false);
  });

  it('should preserve existing state when opt-in status is null (default-enabled from previous versions)', async () => {
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
    ).toBe(null);
    expect(
      newStorage.data.PreferencesController?.preferences
        ?.smartTransactionsMigrationApplied,
    ).toBe(false);
  });

  it('should set stx opt-in to true and mark as migration-enabled when opt-in status is undefined', async () => {
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

  it('should set stx opt-in to true and mark as migration-enabled when opt-in is false and no existing mainnet transactions', async () => {
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

  it('should preserve disabled stx state when user has transaction history', async () => {
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
    ).toBe(false);
  });

  it('should preserve existing stx enabled state', async () => {
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
    ).toBe(false);
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
    ).toBe(false);
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
