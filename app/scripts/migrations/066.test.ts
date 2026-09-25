/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import migration66 from './066';

type MigrationInput = Parameters<typeof migration66.migrate>[0];

describe('migration #66', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 65,
      },
      data: {},
    };

    const newStorage = await migration66.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 66,
    });
  });

  it('should set ledgerTransportType to `u2f` if no preferences controller exists and webhid is not available', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration66.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.u2f);
  });

  it('should set ledgerTransportType to `u2f` if no useLedgerLive property exists and webhid is not available', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migration66.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.u2f);
  });

  it('should set ledgerTransportType to `u2f` if useLedgerLive is false and webhid is not available', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          useLedgerLive: false,
        },
      },
    };

    const newStorage = await migration66.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.u2f);
  });

  it('should fall back to `u2f` if window is unavailable', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          useLedgerLive: false,
        },
      },
    };
    const originalWindow = global.window;

    try {
      delete global.window;

      const newStorage = await migration66.migrate(
        oldStorage as unknown as MigrationInput,
      );

      expect(
        newStorage.data.PreferencesController.ledgerTransportType,
      ).toStrictEqual(LedgerTransportTypes.u2f);
    } finally {
      global.window = originalWindow;
    }
  });

  it('should set ledgerTransportType to `webhid` if useLedgerLive is false and webhid is available', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          useLedgerLive: false,
        },
      },
    };
    const originalNavigator = window.navigator;
    jest
      .spyOn(window, 'navigator', 'get')
      .mockImplementation(() => ({ ...originalNavigator, hid: true }));
    const newStorage = await migration66.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.webhid);
  });

  it('should set ledgerTransportType to `live` if useLedgerLive is true and webhid is available', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          useLedgerLive: true,
        },
      },
    };
    const originalNavigator = window.navigator;
    jest
      .spyOn(window, 'navigator', 'get')
      .mockImplementation(() => ({ ...originalNavigator, hid: true }));
    const newStorage = await migration66.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.live);
  });
});
