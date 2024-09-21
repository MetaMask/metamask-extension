import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import migration66 from './066';

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

    const newStorage = await migration66.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 66,
    });
  });

  it('should set ledgerTransportType to `u2f` if no preferences controller exists and webhid is not available', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration66.migrate(oldStorage);
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

    const newStorage = await migration66.migrate(oldStorage);
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

    const newStorage = await migration66.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.u2f);
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
    jest
      .spyOn(window, 'navigator', 'get')
      .mockImplementation(() => ({ hid: true }));
    const newStorage = await migration66.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.webhid);
  });

  it('should not change ledgerTransportType if useLedgerLive is true and webhid is available', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          useLedgerLive: true,
        },
      },
    };
    jest
      .spyOn(window, 'navigator', 'get')
      .mockImplementation(() => ({ hid: true }));
    const newStorage = await migration66.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual(LedgerTransportTypes.live);
  });
});
