import migration66 from './066';

describe('migration #66', () => {
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

  it('should set ledgerTransportType to an empty string if no preferences controller exists', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration66.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual('');
  });

  it('should set ledgerTransportType to an empty string if no useLedgerLive property exists', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migration66.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual('');
  });

  it('should set ledgerTransportType to an empty string if useLedgerLive is false', async () => {
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
    ).toStrictEqual('');
  });

  it('should set ledgerTransportType to `ledgerLive` if useLedgerLive is true', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          useLedgerLive: true,
        },
      },
    };

    const newStorage = await migration66.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.ledgerTransportType,
    ).toStrictEqual('ledgerLive');
  });
});
