const fixture = {
  data: {
    AddressBookController: {},
    AlertController: {},
    AnnouncementController: {
      announcements: {
        1: {
          isShown: true,
        },
        3: {
          isShown: true,
        },
        4: {
          isShown: true,
        },
        5: {
          isShown: true,
        },
        6: {
          isShown: true,
        },
        7: {
          isShown: false,
        },
        8: {
          isShown: false,
        },
        9: {
          isShown: true,
        },
        10: {
          isShown: true,
        },
        11: {
          isShown: true,
        },
        12: {
          isShown: true,
        },
        13: {
          isShown: true,
        },
        14: {
          isShown: true,
        },
        15: {
          isShown: true,
        },
      },
    },
    AppStateController: {},
    CachedBalancesController: {},
    CollectiblesController: {},
    CurrencyController: {},
    GasFeeController: {},
    IncomingTransactionsController: {},
    KeyringController: {
      vault:
        '{"data":"s6TpYjlUNsn7ifhEFTkuDGBUM1GyOlPrim7JSjtfIxgTt8/6MiXgiR/CtFfR4dWW2xhq85/NGIBYEeWrZThGdKGarBzeIqBfLFhw9n509jprzJ0zc2Rf+9HVFGLw+xxC4xPxgCS0IIWeAJQ+XtGcHmn0UZXriXm8Ja4kdlow6SWinB7sr/WM3R0+frYs4WgllkwggDf2/Tv6VHygvLnhtzp6hIJFyTjh+l/KnyJTyZW1TkZhDaNDzX3SCOHT","iv":"FbeHDAW5afeWNORfNJBR0Q==","salt":"TxZ+WbCW6891C9LK/hbMAoUsSEW1E8pyGLVBU6x5KR8="}',
    },
    MetaMetricsController: {
      metaMetricsId: null,
      participateInMetaMetrics: false,
    },
    NetworkController: {
      network: '1337',
      provider: {
        chainId: '0x539',
        nickname: 'Localhost 8545',
        rpcPrefs: {},
        rpcUrl: 'http://localhost:8545',
        ticker: 'ETH',
        type: 'rpc',
      },
    },
    OnboardingController: {
      completedOnboarding: true,
    },
    PermissionController: {},
    PermissionLogController: {},
    PreferencesController: {},
    SmartTransactionsController: {},
    SubjectMetadataController: {},
    ThreeBoxController: {},
    TokenListController: {},
    TokensController: {},
    TransactionController: {},
    config: {},
    firstTimeInfo: {
      date: 1665507600000,
      version: '10.21.0',
    },
  },
};

const onboardingFixture = {
  data: {
    AppStateController: {
      browserEnvironment: {
        browser: 'chrome',
        os: 'mac',
      },
      collectiblesDetectionNoticeDismissed: false,
      collectiblesDropdownState: {},
      connectedStatusPopoverHasBeenShown: true,
      defaultHomeActiveTabName: null,
      enableEIP1559V2NoticeDismissed: false,
      fullScreenGasPollTokens: [],
      notificationGasPollTokens: [],
      popupGasPollTokens: [],
      qrHardware: {},
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: 1665507600000,
      showPortfolioTooltip: true,
      showTestnetMessageInDropdown: true,
      trezorModel: null,
      usedNetworks: {
        '0x1': true,
        '0x5': true,
        '0x539': true,
      },
    },
    NetworkController: {
      network: '1337',
      networkDetails: {
        EIPS: {
          1559: false,
        },
      },
      previousProviderStore: {
        ticker: 'ETH',
        type: 'rpc',
        rpcUrl: 'http://localhost:8545',
        chainId: '0x539',
        nickname: 'Localhost 8545',
      },
      provider: {
        ticker: 'ETH',
        type: 'rpc',
        rpcUrl: 'http://localhost:8545',
        chainId: '0x539',
        nickname: 'Localhost 8545',
      },
    },
    PreferencesController: {
      advancedGasFee: null,
      currentLocale: 'en',
      customNetworkListEnabled: false,
      dismissSeedBackUpReminder: false,
      featureFlags: {
        showIncomingTransactions: true,
      },
      forgottenPassword: false,
      frequentRpcListDetail: [
        {
          chainId: '0x539',
          nickname: 'Localhost 8545',
          rpcPrefs: {},
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
        },
      ],
      identities: {},
      infuraBlocked: false,
      ipfsGateway: 'dweb.link',
      knownMethodData: {},
      ledgerTransportType: 'webhid',
      lostIdentities: {},
      openSeaEnabled: false,
      preferences: {
        hideZeroBalanceTokens: false,
        showFiatInTestnets: false,
        showTestNetworks: false,
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      theme: 'light',
      useBlockie: false,
      useCollectibleDetection: false,
      useNonceField: false,
      usePhishDetect: true,
      useTokenDetection: false,
    },
    SmartTransactionsController: {
      smartTransactionsState: {
        fees: {},
        liveness: true,
        smartTransactions: {
          '0x1': [],
        },
      },
    },
    TokensController: {
      allDetectedTokens: {},
      allIgnoredTokens: {},
      allTokens: {},
      detectedTokens: [],
      ignoredTokens: [],
      suggestedAssets: [],
      tokens: [],
    },
    config: {},
    firstTimeInfo: {
      date: 1665507600000,
      version: '10.21.0',
    },
  },
};

class FixtureBuilder {
  constructor({ onboarding = false } = {}) {
    this.fixture = onboarding === true ? onboardingFixture : fixture;
  }

  withAddressBookController(data) {
    Object.assign(this.fixture.data.AddressBookController, data);
    return this;
  }

  withAlertController(data) {
    Object.assign(this.fixture.data.AlertController, data);
    return this;
  }

  withAnnouncementController(data) {
    Object.assign(this.fixture.data.AnnouncementController, data);
    return this;
  }

  withAppStateController(data) {
    Object.assign(this.fixture.data.AppStateController, data);
    return this;
  }

  withCachedBalancesController(data) {
    Object.assign(this.fixture.data.CachedBalancesController, data);
    return this;
  }

  withCollectiblesController(data) {
    Object.assign(this.fixture.data.CollectiblesController, data);
    return this;
  }

  withCurrencyController(data) {
    Object.assign(this.fixture.data.CurrencyController, data);
    return this;
  }

  withGasFeeController(data) {
    Object.assign(this.fixture.data.GasFeeController, data);
    return this;
  }

  withIncomingTransactionsController(data) {
    Object.assign(this.fixture.data.IncomingTransactionsController, data);
    return this;
  }

  withKeyringController(data) {
    Object.assign(this.fixture.data.KeyringController, data);
    return this;
  }

  withKeyringControllerImportedAccountVault() {
    return this.withKeyringController({
      vault:
        '{"data":"Ot+BTtJPag0xubdiv1nO9bsSvTHivHCd6CD7Lxgb1McYw3VqMjgp5rPMZmblJ1lscuMxyiqp99G52uXO9S0em6F9htpa+t/wn6qubRKTTNG9fxNzQrKXRDNhdgfYckVk5VAZ4fgl2iMZcRDvS8H/+gucVKJ33Sl6mXyPofdexXhWDCU6uR2YecnfaIum9cL2u/GqOMPE3jxzy0Wip0x2Jyp3QOKhvu8A3GIjzagLOaQ7a1APdl8=","iv":"lbsyPeGYWU6U1+jvmW9UHg==","salt":"Zmbhpskwxe4rYfXtELBvlcvW4HISPBATRmMqzsnZPMg="}',
    });
  }

  withMetaMetricsController(data) {
    Object.assign(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withNetworkController(data) {
    Object.assign(this.fixture.data.NetworkController, data);
    return this;
  }

  withOnboardingController(data) {
    Object.assign(this.fixture.data.OnboardingController, data);
    return this;
  }

  withPermissionController(data) {
    Object.assign(this.fixture.data.PermissionController, data);
    return this;
  }

  withPermissionControllerConnectedToTestDapp() {
    return this.withPermissionController({
      subjects: {
        'http://127.0.0.1:8080': {
          origin: 'http://127.0.0.1:8080',
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: 'http://127.0.0.1:8080',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x5cfe73b6021e818b776b421b1c4db2474086a7e1'],
                },
              ],
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionControllerConnectedToSnapDapp() {
    return this.withPermissionController({
      subjects: {
        'https://metamask.github.io': {
          origin: 'https://metamask.github.io',
          permissions: {
            'wallet_snap_npm:@metamask/test-snap-bip44': {
              id: '8zH-0opWuZhvJew41FMVh',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-bip44',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-managestate': {
              id: 'Z6XPdyuCHCf1pyqSiU7nh',
              parentCapability:
                'wallet_snap_npm:@metamask/test-snap-managestate',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-error': {
              id: '5FUZoCyimOWKTbuLCEOWa',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-error',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-notification': {
              id: '_xfRMXzq0bs8QcXRcvjcP',
              parentCapability:
                'wallet_snap_npm:@metamask/test-snap-notification',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-bip32': {
              id: 'CwdJq0x8N_b9FNxn6dVuP',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-bip32',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
            'wallet_snap_npm:@metamask/test-snap-confirm': {
              id: 'Wb_1c9toBggBQWfOJwjMg',
              parentCapability: 'wallet_snap_npm:@metamask/test-snap-confirm',
              invoker: 'https://metamask.github.io',
              caveats: null,
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionLogController(data) {
    Object.assign(this.fixture.data.PermissionLogController, data);
    return this;
  }

  withPreferencesController(data) {
    Object.assign(this.fixture.data.PreferencesController, data);
    return this;
  }

  withSmartTransactionsController(data) {
    Object.assign(this.fixture.data.SmartTransactionsController, data);
    return this;
  }

  withSubjectMetadataController(data) {
    Object.assign(this.fixture.data.SubjectMetadataController, data);
    return this;
  }

  withThreeBoxController(data) {
    Object.assign(this.fixture.data.ThreeBoxController, data);
    return this;
  }

  withTokenListController(data) {
    Object.assign(this.fixture.data.TokenListController, data);
    return this;
  }

  withTokensController(data) {
    Object.assign(this.fixture.data.TokensController, data);
    return this;
  }

  withTransactionController(data) {
    Object.assign(this.fixture.data.TransactionController, data);
    return this;
  }

  withTransactionControllerMultipleTransactions() {
    return this.withTransactionController({
      transactions: {
        7911313280012623: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012623,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545991949,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545992244,
                value: false,
              },
            ],
          ],
          id: 7911313280012623,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545991949,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        7911313280012624: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012624,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545994578,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545994695,
                value: false,
              },
            ],
          ],
          id: 7911313280012624,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545994578,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        7911313280012625: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012625,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545996673,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545996678,
                value: false,
              },
            ],
          ],
          id: 7911313280012625,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545996673,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        7911313280012626: {
          chainId: '0x539',
          dappSuggestedGasFees: {
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
          history: [
            {
              chainId: '0x539',
              dappSuggestedGasFees: {
                gas: '0x5208',
                gasPrice: '0x4a817c800',
              },
              id: 7911313280012626,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545998675,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                gasPrice: '0x4a817c800',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545998677,
                value: false,
              },
            ],
          ],
          id: 7911313280012626,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545998675,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            gasPrice: '0x4a817c800',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerTypeOneTransaction() {
    return this.withTransactionController({
      transactions: {
        4046084157914634: {
          chainId: '0x539',
          history: [
            {
              chainId: '0x539',
              id: 4046084157914634,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                gasPrice: '0x2540be400',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
          ],
          id: 4046084157914634,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'metamask',
          primaryTransaction: {
            chainId: '0x539',
            id: 4046084157914634,
            loadingDefaults: true,
            metamaskNetworkId: '1337',
            origin: 'metamask',
            status: 'unapproved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              gasPrice: '0x2540be400',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'unapproved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            gasPrice: '0x2540be400',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerTypeTwoTransaction() {
    return this.withTransactionController({
      transactions: {
        4046084157914634: {
          chainId: '0x539',
          history: [
            {
              chainId: '0x539',
              id: 4046084157914634,
              loadingDefaults: true,
              metamaskNetworkId: '1337',
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                type: '0x2',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
          ],
          id: 4046084157914634,
          loadingDefaults: false,
          metamaskNetworkId: '1337',
          origin: 'metamask',
          primaryTransaction: {
            chainId: '0x539',
            id: 4046084157914634,
            loadingDefaults: true,
            metamaskNetworkId: '1337',
            origin: 'metamask',
            status: 'unapproved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              maxFeePerGas: '0x59682f0c',
              maxPriorityFeePerGas: '0x59682f00',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              type: '0x2',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'unapproved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            type: '0x2',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  build() {
    this.fixture.meta = {
      version: 74,
    };
    return this.fixture;
  }
}

module.exports = FixtureBuilder;
