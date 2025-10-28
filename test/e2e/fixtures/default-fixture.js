const { mockNetworkStateOld } = require('../../stub/networks');
const { CHAIN_IDS } = require('../../../shared/constants/network');
const { FirstTimeFlowType } = require('../../../shared/constants/onboarding');

// TODO: Should we bump this?
// The e2e tests currently configure state in the schema of migration 74.
// This requires us to specify network state in the old schema, so it can run through the migrations.
// We could bump this to latest, but it breaks too many other things to handle right now.
const FIXTURE_STATE_METADATA_VERSION = 74;

const E2E_SRP =
  'spread raise short crane omit tent fringe mandate neglect detail suspect cradle';

function defaultFixture(inputChainId = CHAIN_IDS.LOCALHOST) {
  return {
    data: {
      AuthenticationController: {
        isSignedIn: true,
      },
      NotificationServicesController: {
        subscriptionAccountsSeen: [],
        isFeatureAnnouncementsEnabled: false,
        isNotificationServicesEnabled: false,
        isMetamaskNotificationsFeatureSeen: false,
        metamaskNotificationsList: [],
        metamaskNotificationsReadList: [],
      },
      AccountTreeController: {
        accountTree: {
          wallets: {
            'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK': {
              type: 'entropy',
              id: 'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK',
              metadata: {
                name: 'Wallet 1',
                entropy: {
                  id: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                },
              },
              status: 'ready',
              groups: {
                'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK/0': {
                  type: 'multichain-account',
                  id: 'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK/0',
                  metadata: {
                    name: 'Account 1',
                    pinned: false,
                    hidden: false,
                    entropy: {
                      groupIndex: 0,
                    },
                  },
                  accounts: [
                    'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
                    'c9e610f0-5617-48e7-a79f-d8cfd37f70f4',
                  ],
                },
              },
            },
          },
          selectedAccountGroup: 'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK/0',
        },
        isAccountTreeSyncingInProgress: false,
        hasAccountTreeSyncingSyncedAtLeastOnce: false,
        accountGroupsMetadata: {
          'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK/0': {
            name: {
              value: 'Account 1',
              lastUpdatedAt: 0,
            },
            pinned: {
              value: false,
              lastUpdatedAt: 0,
            },
            hidden: {
              value: false,
              lastUpdatedAt: 0,
            },
          },
        },
        accountWalletsMetadata: {},
      },
      AccountsController: {
        internalAccounts: {
          accounts: {
            'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
              id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              options: {
                entropySource: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                derivationPath: "m/44'/60'/0'/0/0",
                groupIndex: 0,
                entropy: {
                  type: 'mnemonic',
                  id: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                  derivationPath: "m/44'/60'/0'/0/0",
                  groupIndex: 0,
                },
              },
              methods: [
                'personal_sign',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              scopes: ['eip155:0'],
              type: 'eip155:eoa',
              metadata: {
                name: 'Account 1',
                importTime: 1761093330346,
                lastSelected: 1761093448033,
                keyring: {
                  type: 'HD Key Tree',
                },
              },
            },
            'c9e610f0-5617-48e7-a79f-d8cfd37f70f4': {
              type: 'solana:data-account',
              id: 'c9e610f0-5617-48e7-a79f-d8cfd37f70f4',
              address: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              options: {
                entropySource: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                derivationPath: "m/44'/501'/0'/0'",
                index: 0,
                entropy: {
                  type: 'mnemonic',
                  id: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                  groupIndex: 0,
                  derivationPath: "m/44'/501'/0'/0'",
                },
              },
              methods: [
                'signAndSendTransaction',
                'signTransaction',
                'signMessage',
                'signIn',
              ],
              scopes: [
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
                'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
              ],
              metadata: {
                name: 'Solana Account 1',
                importTime: 1761353236138,
                keyring: {
                  type: 'Snap Keyring',
                },
                snap: {
                  id: 'npm:@metamask/solana-wallet-snap',
                  name: 'Solana',
                  enabled: true,
                },
                lastSelected: 0,
                nameLastUpdatedAt: 1761353236170,
              },
            },
          },
          selectedAccount: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
        },
      },

      AlertController: {
        alertEnabledness: {
          unconnectedAccount: true,
          web3ShimUsage: true,
        },
        unconnectedAccountAlertShownOrigins: {},
        web3ShimUsageOrigins: {},
      },
      AnnouncementController: {
        announcements: {
          8: {
            date: '2021-11-01',
            id: 8,
            isShown: false,
          },
        },
      },
      NetworkOrderController: {
        orderedNetworkList: [
          {
            networkId: '0x1',
            networkRpcUrl:
              'https://mainnet.infura.io/v3/00000000000000000000000000000000',
          },
          {
            networkId: '0xe708',
            networkRpcUrl:
              'https://linea-mainnet.infura.io/v3/00000000000000000000000000000000',
          },
          {
            networkId: inputChainId,
            networkRpcUrl: 'http://localhost:8545',
          },
        ],
      },
      NetworkEnablementController: {
        enabledNetworkMap: {
          eip155: {
            [inputChainId]: true,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
          },
        },
      },
      AccountOrderController: {
        pinnedAccountList: [],
        hiddenAccountList: [],
      },
      AppStateController: {
        browserEnvironment: {},
        nftsDropdownState: {},
        connectedStatusPopoverHasBeenShown: true,
        termsOfUseLastAgreed:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        defaultHomeActiveTabName: null,
        fullScreenGasPollTokens: [],
        notificationGasPollTokens: [],
        popupGasPollTokens: [],
        recoveryPhraseReminderHasBeenShown: true,
        pna25Acknowledged: false,
        recoveryPhraseReminderLastShown:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        showTestnetMessageInDropdown: true,
        trezorModel: null,
        isRampCardClosed: false,
        newPrivacyPolicyToastClickedOrClosed: true,
        newPrivacyPolicyToastShownDate: Date.now(),
        snapsInstallPrivacyWarningShown: true,
        hasShownMultichainAccountsIntroModal: true,
        showShieldEntryModalOnce: false,
        pendingShieldCohort: null,
        pendingShieldCohortTxType: null,
        appActiveTab: {
          id: 1,
          title: 'E2E Test Dapp',
          origin: 'http://127.0.0.1:8080',
          protocol: 'http:',
          url: 'http://127.0.0.1:8080',
          host: '127.0.0.1:8080',
          href: 'http://127.0.0.1:8080',
        },
      },
      BridgeController: {},
      CurrencyController: {
        currentCurrency: 'usd',
        currencyRates: {
          ETH: {
            conversionDate: 1665507600.0,
            conversionRate: 1700.0,
            usdConversionRate: 1700.0,
          },
          MON: {
            conversionDate: 1665507600.0,
            conversionRate: 0.2,
            usdConversionRate: 0.2,
          },
        },
      },
      GasFeeController: {
        estimatedGasFeeTimeBounds: {},
        gasEstimateType: 'none',
        gasFeeEstimates: {},
      },
      KeyringController: {
        vault:
          '{"data":"82RULUsbxGGJHY2w+Zlb7+ziEycjGlZt/cwi7wFC0bP2dv4p8Qbhkv4eIXDSeuPmG2OLFofkyK2iUFw6I2wNCm40Iw21hQi14fnXu7z53qLgZ31hlfjgIlOfak6HbIhme6Qv8wHW0Kq5p5hbRkonsCxPLuQ0SI9Qnhcwvjp+8ARjVyxMp/u8E1Xf5I8CZb02gQooUny0pygVNoFSG8CQsYr5YV3/syWcojrYW3HORGP7ZgPxkNdUQ6/dWzFFq6VT396tUQDaWEr3og9ehp77k48Wzwa7vaX5INwUK953EAUeUbMOAZKtzDDfuP2IaHzrVYkbnkH364Dl6rcy30qip7voSCnDick3wX9tAQLaxNhFhWy/meJZbpJCRGHnq3h3164l0hfhHPwXYp+P4Yf42yRFohJcwjO9QWyXZKY49+rOQL23otSyaResxh3gVnnu2NlESdwBssKk6xpa7h4qFWWLEJUOCwKOCWXxNO4oKo0Gf0zGZX7db2hWpLQHA81Mzw2v3tsYA0BnT0hxLdK7tpfZ+E4cTcU4uy53y3eNusIZ35CEae05206BflULAYPmsnTJOalJXpQmUJWN9JwSC04Sn+082ZWXPAIJusVVTKk5yitcDyntBUxywm++AoWFfARzxUGGYCzP6YBG5P4eSmHhWES2ID/fLhTQZbNevRn+wutMJJGReO8xhEgzzmcQWZZpYf5I4tfRjS8C/bovAUoJyMwOks2m35uCYHGVz4r+leC/BcbQsBWTuD1UD7sppRSxRguL38VN9gtC+t39/G6qn13fciunn8UXfeZpJF2wFD2FxGY7msXatu4Ta5bESXK+AT5kn4et1JnUPo3zDuLega2zmPFa20Sl8IwO4b0iYrzY+c2MMyc2I2A0nqfCE2uIdOfobP+73McLx+L3zQXfGuDgHQto8hZoVv/5PSbXwcrMZkLnJYJdh7wxHQ2+BzGtov7Xu5JCSoFsuAYZEzxMU5E+LzvGNcp6HEtnobgibkR+3hlq0yFI6MLvici4LCeRsw/toIXovnyrWkxoFILHtBGBCKSkObkOt1/P01YSVEnP6NmB7vVh368Is05AdECHyT2Y/34c+fe0gsdaJkXOrHBva4QyIuhzl+0JUR+vgzTwUsl+QcYVR9oGB2Yn/uVVRhEPDSZ+6ec0atC88rFqaa2eI5vKGWeL5jmaTRgAmIPwMtCSUzgI7kThxSdUNFWJOBdj4zlP7A3Jgm0GTpbpGBhTiKJB2AhZIT/OR+nLmSRjxpmChusuFVoUFfB5kgX8U3uxoua4KQfKPbIxt04avx0ZwzjaEgMLz8OrrTtUX0FhNA91yfE+xtpHlFbaUW2kDmTUINwBIKFptV89Rn3x1LiKGuUZh9CHIpD8HN5n3stKVbiaCwDszEcMMokXin/IbdA4EirH+Luv+WgYm77lKQ6PCJJ1Tbjxg13wyaDlliqVYH7gKHCiXf+AJLd5MtpTjsAv9e1/EYZGjh9FatDhuH35qfVzwc4u+7/sndWHqAGzb0Y0sgQ5DNv2dyCHBx+n8yfh3MYxS7l6lzERRhvzwqptAVE0HAyUdBhS0e7SFGPtfCcyDzc5vQsJIT43Fo5RMdTIBe2tZJV9\",\"iv\":\"Nw6WKgYoNrSXQFGrZ+irEg==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"wvwtQD7ZuS4kWNwQ72dBAuzMszoFoK/M2Urai+stlo0="}',
      },
      MetaMetricsController: {
        eventsBeforeMetricsOptIn: [],
        tracesBeforeMetricsOptIn: [],
        fragments: {},
        metaMetricsId: null,
        participateInMetaMetrics: false,
        dataCollectionForMarketing: false,
        traits: {},
        latestNonAnonymousEventTimestamp: 0,
      },
      MetaMetricsDataDeletionController: {
        metaMetricsDataDeletionId: null,
        metaMetricsDataDeletionTimestamp: 0,
      },
      NetworkController: {
        ...mockNetworkStateOld({
          id: 'networkConfigurationId',
          chainId: inputChainId,
          nickname: 'Localhost 8545',
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          blockExplorerUrl: undefined,
        }),
        providerConfig: { id: 'networkConfigurationId' },
      },
      OnboardingController: {
        completedOnboarding: true,
        firstTimeFlowType: FirstTimeFlowType.import,
        onboardingTabs: {},
        seedPhraseBackedUp: true,
      },
      PermissionController: {
        subjects: {},
      },
      PreferencesController: {
        advancedGasFee: null,
        currentLocale: 'en',
        useExternalServices: true,
        dismissSeedBackUpReminder: true,
        overrideContentSecurityPolicyHeader: true,
        featureFlags: {},
        forgottenPassword: false,
        identities: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
        },
        ipfsGateway: 'dweb.link',
        knownMethodData: {},
        ledgerTransportType: 'webhid',
        lostIdentities: {},
        openSeaEnabled: false,
        preferences: {
          hideZeroBalanceTokens: false,
          showExtensionInFullSizeView: false,
          showFiatInTestnets: false,
          showTestNetworks: false,
          smartTransactionsOptInStatus: true,
          showNativeTokenAsMainBalance: true,
          petnamesEnabled: true,
          showMultiRpcModal: false,
          showConfirmationAdvancedDetails: false,
          tokenSortConfig: {
            key: 'tokenFiatAmount',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          shouldShowAggregatedBalancePopover: true,
          tokenNetworkFilter: {},
          avatarType: 'maskicon',
        },
        selectedAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        theme: 'light',
        useBlockie: false,
        useNftDetection: false,
        usePhishDetect: true,
        useTokenDetection: false,
        useCurrencyRateCheck: true,
        useMultiAccountBalanceChecker: true,
        isMultiAccountBalancesEnabled: true,
        referrals: {
          hyperliquid: {},
        },
      },
      SelectedNetworkController: {
        domains: {},
      },
      SmartTransactionsController: {
        smartTransactionsState: {
          fees: {},
          feesByChainId: {},
          liveness: true,
          livenessByChainId: {},
          smartTransactions: {
            [CHAIN_IDS.MAINNET]: [],
          },
        },
      },
      SubjectMetadataController: {
        subjectMetadata: {
          'https://metamask.github.io': {
            extensionId: null,
            iconUrl: null,
            name: 'MetaMask < = > Ledger Bridge',
            origin: 'https://metamask.github.io',
            subjectType: 'website',
          },
        },
      },
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
      },
      MultichainAccountService: {},
      TransactionController: {
        transactions: {},
      },
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}

module.exports = { defaultFixture, FIXTURE_STATE_METADATA_VERSION, E2E_SRP };
