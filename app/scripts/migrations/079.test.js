<<<<<<< HEAD
import migration79 from './079';

describe('migration #79', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 78,
      },
    };

    const newStorage = await migration79.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 79,
    });
  });

  it('should remove the "collectiblesDetectionNoticeDismissed"', async () => {
=======
import {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} from '@metamask/rpc-methods';
import migration78 from './079';

describe('migration #78', () => {
  it('should consolidate snap permissions as caveats under the wallet_snap permission', async () => {
>>>>>>> 192c62011 (update migration #)
    const oldStorage = {
      meta: {
        version: 78,
      },
      data: {
<<<<<<< HEAD
        AppStateController: {
          collectiblesDetectionNoticeDismissed: false,
          bar: 'baz',
=======
        PermissionController: {
          subjects: {
            'example.com': {
              permissions: {
                'wallet_snap_npm:foobar': {
                  caveats: null,
                  date: 2,
                  id: 'a7342F4b-beae-4525-a36c-c0635fd03359',
                  invoker: 'example.com',
                  parentCapability: 'wallet_snap_npm:foobar',
                },
                'wallet_snap_npm:baz': {
                  caveats: null,
                  date: 3,
                  id: 'x342A44-beae-4525-a36c-c0635fd03359',
                  invoker: 'example.com',
                  parentCapability: 'wallet_snap_npm:baz',
                },
              },
            },
            'aave.com': {
              permissions: {
                'wallet_snap_npm:filsnap': {
                  caveats: null,
                  date: 10,
                  id: 'a7342F4b-beae-4525-a36c-c0635fd03359',
                  invoker: 'aave.com',
                  parentCapability: 'wallet_snap_npm:foobar',
                },
                'wallet_snap_npm:btcsnap': {
                  caveats: null,
                  date: 3,
                  id: 'x342A44-beae-4525-a36c-c0635fd03359',
                  invoker: 'aave.com',
                  parentCapability: 'wallet_snap_npm:btcsnap',
                },
              },
            },
          },
>>>>>>> 192c62011 (update migration #)
        },
      },
    };

<<<<<<< HEAD
    const newStorage = await migration79.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 79,
      },
      data: {
        AppStateController: {
          bar: 'baz',
=======
    const newStorage = await migration78.migrate(oldStorage);

    expect(newStorage).toStrictEqual({
      meta: { version: 79 },
      data: {
        PermissionController: {
          subjects: {
            'example.com': {
              permissions: {
                [WALLET_SNAP_PERMISSION_KEY]: {
                  caveats: [
                    {
                      type: SnapCaveatType.SnapIds,
                      value: {
                        'npm:foobar': {},
                        'npm:baz': {},
                      },
                    },
                  ],
                  date: 3,
                  id: 'x342A44-beae-4525-a36c-c0635fd03359',
                  invoker: 'example.com',
                  parentCapability: WALLET_SNAP_PERMISSION_KEY,
                },
              },
            },
            'aave.com': {
              permissions: {
                [WALLET_SNAP_PERMISSION_KEY]: {
                  caveats: [
                    {
                      type: SnapCaveatType.SnapIds,
                      value: {
                        'npm:btcsnap': {},
                        'npm:filsnap': {},
                      },
                    },
                  ],
                  date: 10,
                  id: 'a7342F4b-beae-4525-a36c-c0635fd03359',
                  invoker: 'aave.com',
                  parentCapability: WALLET_SNAP_PERMISSION_KEY,
                },
              },
            },
          },
>>>>>>> 192c62011 (update migration #)
        },
      },
    });
  });

<<<<<<< HEAD
  it('should remove the "collectiblesDropdownState"', async () => {
=======
  it('should leave state unchanged if there are no snap permissions', async () => {
>>>>>>> 192c62011 (update migration #)
    const oldStorage = {
      meta: {
        version: 78,
      },
      data: {
<<<<<<< HEAD
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
=======
        PermissionController: {
          subjects: {
            'example.com': {
              permissions: {
                eth_accounts: {
                  date: 2,
                  id: 'a7342F4b-beae-4525-a36c-c0635fd03359',
                  invoker: 'example.com',
                  parentCapability: 'eth_accounts',
                },
              },
            },
          },
>>>>>>> 192c62011 (update migration #)
        },
      },
    };

<<<<<<< HEAD
    const newStorage = await migration79.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 79,
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
        version: 78,
      },
      data: {
        AppStateController: {
          bar: 'baz',
        },
      },
    };

    const newStorage = await migration79.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 79,
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
    };

    const newStorage = await migration79.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 79,
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
=======
    const newStorage = await migration78.migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
>>>>>>> 192c62011 (update migration #)
  });
});
