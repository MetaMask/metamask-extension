/**
 * @typedef {object} FirstTimeState
 * @property {object} config Initial configuration parameters
 * @property {object} NetworkController Network controller state
 */

/**
 * @type {FirstTimeState}
 */
const baseState = {
  config: {},
};

let firstTimeDevState = {};

if (process.env.DEV_STATE) {
  firstTimeDevState = {
    AppStateController: {
      browserEnvironment: {
        browser: 'chrome',
        os: 'linux',
      },
      connectedStatusPopoverHasBeenShown: true,
      defaultHomeActiveTabName: null,
      fullScreenGasPollTokens: [],
      nftsDetectionNoticeDismissed: false,
      nftsDropdownState: {},
      notificationGasPollTokens: [],
      outdatedBrowserWarningLastShown: Date.now(),
      popupGasPollTokens: [],
      qrHardware: {},
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: Date.now(),
      serviceWorkerLastActiveTime: 0,
      showBetaHeader: false,
      showProductTour: true,
      showTestnetMessageInDropdown: true,
      termsOfUseLastAgreed: Date.now(),
      trezorModel: null,
      usedNetworks: {
        '0x1': true,
        '0x5': true,
        '0x539': true,
      },
    },
    AnnouncementController: {
      announcements: {
        1: {
          date: '2021-03-17',
          id: 1,
          image: {
            height: '230px',
            placeImageBelowDescription: true,
            src: 'images/mobile-link-qr.svg',
            width: '230px',
          },
          isShown: false,
        },
        3: {
          date: '2021-03-08',
          id: 3,
          isShown: false,
        },
        4: {
          date: '2021-05-11',
          id: 4,
          image: {
            src: 'images/source-logos-bsc.svg',
            width: '100%',
          },
          isShown: false,
        },
        5: {
          date: '2021-06-09',
          id: 5,
          isShown: false,
        },
        6: {
          date: '2021-05-26',
          id: 6,
          isShown: false,
        },
        7: {
          date: '2021-09-17',
          id: 7,
          isShown: false,
        },
        8: {
          date: '2021-11-01',
          id: 8,
          isShown: false,
        },
        9: {
          date: '2021-12-07',
          id: 9,
          image: {
            src: 'images/txinsights.png',
            width: '80%',
          },
          isShown: false,
        },
        10: {
          date: '2022-09-15',
          id: 10,
          image: {
            src: 'images/token-detection.svg',
            width: '100%',
          },
          isShown: false,
        },
        11: {
          date: '2022-09-15',
          id: 11,
          isShown: false,
        },
        12: {
          date: '2022-05-18',
          id: 12,
          image: {
            src: 'images/darkmode-banner.png',
            width: '100%',
          },
          isShown: false,
        },
        13: {
          date: '2022-09-15',
          id: 13,
          isShown: false,
        },
        14: {
          date: '2022-09-15',
          id: 14,
          isShown: false,
        },
        15: {
          date: '2022-09-15',
          id: 15,
          isShown: false,
        },
        16: {
          date: null,
          id: 16,
          isShown: false,
        },
        17: {
          date: null,
          id: 17,
          isShown: false,
        },
        18: {
          date: null,
          id: 18,
          image: {
            src: 'images/open-sea-security-provider.svg',
            width: '100%',
          },
          isShown: true,
        },
        19: {
          date: null,
          id: 19,
          image: {
            src: 'images/nfts.svg',
            width: '100%',
          },
          isShown: true,
        },
        20: {
          date: null,
          id: 20,
          isShown: false,
        },
      },
    },
    AccountTracker: {
      accounts: {
        '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc': {
          address: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
          balance: '0x7d52',
        },
      },
      currentBlockGasLimit: '0x1c9c380',
    },
    KeyringController: {
      vault:
        '{"data":"HRilvv+YlDfNFLSvrdENKDdkGSvQf/Nyo0K+BOFQN4MFqtnsuG2yHYxHSV9M2G2zODKxar5pqoxaVkxMtg9ME1Bhu9aGwunMIbDTpToBS52l07aI2ZXrcqMsGATqDRgB8d9H8q3KdRBZ5ANEH9Pxz2IKimQ61XjziC24JfkpR8K5juv4MPiOcVigY2zAGvgqquQJg79tBCVntfQmkpzva0QKcNatmmYcgXH0x3Ek3DErGszCwWHFAq9yx0r7TYPXClcUh9vPzfYOo1MSHHHQ+2mGmjBb0uPPBCBheyVJ+BGDwYl3EMDImH4Ij5tHRipkbYeEk7DPlipHL2c/f2I9Lfj5//yyVKmfZYgf4eXzCJ4MBwWc12xIJQe4a/uEU9kOqKBBrrct6x70U9jDqak0c5b46O3uR3ARfHBrB7xPcfAUlVskCt6DoUXMuxcQRHK4OfaCVQRPQzzfW69w5Yrsu/RcMbcSmiZ+yOUruqY+bmEuRleRLIMOJaupsE6oq51GEqyVzrmCDx7iUld6DddHlxZoJgpALA0cNY9JckNthEiDdHTSu/pVxa80GTZA+EjR7v7+xFO3bgZwrV6UpOCyvIuv3D8VsJuA6VEG5a0MH+AhVAQOsJPfjjU2N+OGIszriC5AA8HI+XCOzf8yjbmUktcvonqXg9L09UOpD39dYtZWuUe6Dk9xnftSGLea/xZKdfI/dgGKbpFJdrSsI2wed/8ZdnksllD/p9cVo1y3nDKG1op5aUmeT33hj8TngDJEU/WWCxQ9XQbY7wNbcDZAI/G8isPK","iv":"hf70o8s7fiXKfDNDwx+ZqQ==","salt":"6gfYj2OWoz9YkmlJ9o2jvU+09MVXOkleN6yvnC76AOU="}',
    },
    NetworkController: {
      networkConfigurations: {
        'e3803bdf-4129-40d5-a7ff-4ede1f3bff9c': {
          chainId: '0x1',
          id: 'e3803bdf-4129-40d5-a7ff-4ede1f3bff9c',
          nickname: 'Ganache Mainnet Fork',
          rpcPrefs: {},
          rpcUrl: 'http://127.0.0.1:8545',
          ticker: 'ETH',
        },
      },
      networkDetails: {
        EIPS: {
          1559: true,
        },
      },
      networkId: '1',
      networkStatus: 'available',
      providerConfig: {
        chainId: '0x1',
        id: 'e3803bdf-4129-40d5-a7ff-4ede1f3bff9c',
        nickname: 'Ganache Mainnet Fork',
        rpcPrefs: {},
        rpcUrl: 'http://127.0.0.1:8545',
        ticker: 'ETH',
        type: 'rpc',
      },
    },
    OnboardingController: {
      completedOnboarding: true,
      firstTimeFlowType: 'import',
      onboardingTabs: {},
      seedPhraseBackedUp: null,
    },
    PreferencesController: {
      advancedGasFee: null,
      currentLocale: 'en',
      disabledRpcMethodPreferences: {
        eth_sign: false,
      },
      dismissSeedBackUpReminder: false,
      featureFlags: {
        showIncomingTransactions: true,
      },
      forgottenPassword: false,
      identities: {
        '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc': {
          address: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
          lastSelected: 1685633992523,
          name: 'Account 1',
        },
      },
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
      selectedAddress: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
      theme: 'os',
      transactionSecurityCheckEnabled: false,
      useBlockie: false,
      useCurrencyRateCheck: true,
      useMultiAccountBalanceChecker: true,
      useNftDetection: false,
      useNonceField: false,
      usePhishDetect: true,
      useTokenDetection: false,
    },
  };
}

const initialState = { ...baseState, ...firstTimeDevState };

export default initialState;
