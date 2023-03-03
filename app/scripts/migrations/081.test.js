import {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} from '@metamask/rpc-methods';
import { migrate, version as newVersion } from './081';

describe('migration #81', () => {
  it('should consolidate snap permissions as caveats under the wallet_snap permission', async () => {
    const oldStorage = {
      meta: {
        version: 80,
      },
      data: {
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
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual({
      meta: { version: newVersion },
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
        },
      },
    });
  });

  it('should leave state unchanged if there are no snap permissions', async () => {
    const oldStorage = {
      meta: {
        version: 80,
      },
      data: {
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
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
