<<<<<<< HEAD
import {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} from '@metamask/rpc-methods';
import migration79 from './079';

describe('migration #79', () => {
  it('should consolidate snap permissions as caveats under the wallet_snap permission', async () => {
=======
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

  it('should remove the "showPortfolioToolip" property', async () => {
>>>>>>> develop
    const oldStorage = {
      meta: {
        version: 78,
      },
      data: {
<<<<<<< HEAD
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
=======
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
          unapprovedTxs: {},
          frequentRpcList: [],
          addressBook: {},
          popupGasPollTokens: [],
          notificationGasPollTokens: [],
          fullScreenGasPollTokens: [],
          recoveryPhraseReminderHasBeenShown: false,
          recoveryPhraseReminderLastShown: 1675966206345,
          outdatedBrowserWarningLastShown: 1675966206345,
          showTestnetMessageInDropdown: true,
          showPortfolioTooltip: false,
          showBetaHeader: false,
          trezorModel: null,
          qrHardware: {},
>>>>>>> develop
        },
      },
    };

    const newStorage = await migration79.migrate(oldStorage);
<<<<<<< HEAD

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
=======
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
          unapprovedTxs: {},
          frequentRpcList: [],
          addressBook: {},
          popupGasPollTokens: [],
          notificationGasPollTokens: [],
          fullScreenGasPollTokens: [],
          recoveryPhraseReminderHasBeenShown: false,
          recoveryPhraseReminderLastShown: 1675966206345,
          outdatedBrowserWarningLastShown: 1675966206345,
          showTestnetMessageInDropdown: true,
          showBetaHeader: false,
          trezorModel: null,
          qrHardware: {},
>>>>>>> develop
        },
      },
    });
  });

<<<<<<< HEAD
  it('should leave state unchanged if there are no snap permissions', async () => {
=======
  it('should make no changes if "showPortfolioToolip" never existed', async () => {
>>>>>>> develop
    const oldStorage = {
      meta: {
        version: 78,
      },
      data: {
<<<<<<< HEAD
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
=======
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
          unapprovedTxs: {},
          frequentRpcList: [],
          addressBook: {},
          popupGasPollTokens: [],
          notificationGasPollTokens: [],
          fullScreenGasPollTokens: [],
          recoveryPhraseReminderHasBeenShown: false,
          recoveryPhraseReminderLastShown: 1675966206345,
          outdatedBrowserWarningLastShown: 1675966206345,
          showTestnetMessageInDropdown: true,
          showBetaHeader: false,
          trezorModel: null,
          qrHardware: {},
>>>>>>> develop
        },
      },
    };

    const newStorage = await migration79.migrate(oldStorage);
<<<<<<< HEAD

    expect(newStorage.data).toStrictEqual(oldStorage.data);
=======
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
          unapprovedTxs: {},
          frequentRpcList: [],
          addressBook: {},
          popupGasPollTokens: [],
          notificationGasPollTokens: [],
          fullScreenGasPollTokens: [],
          recoveryPhraseReminderHasBeenShown: false,
          recoveryPhraseReminderLastShown: 1675966206345,
          outdatedBrowserWarningLastShown: 1675966206345,
          showTestnetMessageInDropdown: true,
          showBetaHeader: false,
          trezorModel: null,
          qrHardware: {},
        },
      },
    });
>>>>>>> develop
  });
});
