import migration80 from './080';

describe('migration #80', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 80,
      },
    };

    const newStorage = await migration80.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 80,
    });
  });

  it('should remove the "showPortfolioToolip" property', async () => {
    const oldStorage = {
      meta: {
        version: 80,
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
          showPortfolioTooltip: false,
          showBetaHeader: false,
          trezorModel: null,
          qrHardware: {},
        },
      },
    };

    const newStorage = await migration80.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 80,
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
  });

  it('should make no changes if "showPortfolioToolip" never existed', async () => {
    const oldStorage = {
      meta: {
        version: 80,
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
    };

    const newStorage = await migration80.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 80,
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
  });
});
