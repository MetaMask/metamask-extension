import migration78 from './078';

describe('migration #78', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
    };

    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 78,
    });
  });

  it('should remove the "collectiblesDetectionNoticeDismissed"', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        AppStateController: {
          collectiblesDetectionNoticeDismissed: false,
          bar: 'baz',
        },
      },
    };

    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        AppStateController: {
          bar: 'baz',
        },
      },
    });
  });

  it('should remove the "collectiblesDropdownState"', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        metamask: {
          isInitialized: true,
          isUnlocked: true,
          isAccountMenuOpen: false,
          identities: {
            '0x00000': {
              address: '0x00000',
              lastSelected: 1675966229118,
              name: 'Account 1',
            },
            '0x00001': {
              address: '0x00001',
              name: 'Account 2',
            },
          },
          collectiblesDropdownState: {},
          qrHardware: {},
        },
      },
    };

    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        metamask: {
          isInitialized: true,
          isUnlocked: true,
          isAccountMenuOpen: false,
          identities: {
            '0x00000': {
              address: '0x00000',
              lastSelected: 1675966229118,
              name: 'Account 1',
            },
            '0x00001': {
              address: '0x00001',
              name: 'Account 2',
            },
          },
          qrHardware: {},
        },
      },
    });
  });

  it('should make no changes if "collectiblesDetectionNoticeDismissed" never existed', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        AppStateController: {
          bar: 'baz',
        },
      },
    };

    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        AppStateController: {
          bar: 'baz',
        },
      },
    });
  });
  it('should make no changes if "collectiblesDropdownState" never existed', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        metamask: {
          isInitialized: true,
          isUnlocked: true,
          isAccountMenuOpen: false,
          identities: {
            '0x00000': {
              address: '0x00000',
              lastSelected: 1675966229118,
              name: 'Account 1',
            },
            '0x00001': {
              address: '0x00001',
              name: 'Account 2',
            },
          },
          qrHardware: {},
        },
      },
    };

    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        metamask: {
          isInitialized: true,
          isUnlocked: true,
          isAccountMenuOpen: false,
          identities: {
            '0x00000': {
              address: '0x00000',
              lastSelected: 1675966229118,
              name: 'Account 1',
            },
            '0x00001': {
              address: '0x00001',
              name: 'Account 2',
            },
          },
          qrHardware: {},
        },
      },
    });
  });
});
