import { ApprovalType, NetworkType } from '@metamask/controller-utils';
import mockState from '../../test/data/mock-state.json';
import { KeyringType } from '../../shared/constants/keyring';
import {
  CHAIN_IDS,
  LOCALHOST_DISPLAY_NAME,
  NETWORK_TYPES,
  OPTIMISM_DISPLAY_NAME,
} from '../../shared/constants/network';
import * as selectors from './selectors';

jest.mock('../../shared/modules/network.utils', () => {
  const actual = jest.requireActual('../../shared/modules/network.utils');
  return {
    ...actual,
    shouldShowLineaMainnet: jest.fn().mockResolvedValue(true),
  };
});

describe('Selectors', () => {
  describe('#getSelectedAddress', () => {
    it('returns undefined if selectedAddress is undefined', () => {
      expect(selectors.getSelectedAddress({ metamask: {} })).toBeUndefined();
    });

    it('returns selectedAddress', () => {
      const selectedAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
      expect(
        selectors.getSelectedAddress({ metamask: { selectedAddress } }),
      ).toStrictEqual(selectedAddress);
    });
  });

  describe('#getSuggestedTokens', () => {
    it('returns an empty array if pendingApprovals is undefined', () => {
      expect(selectors.getSuggestedTokens({ metamask: {} })).toStrictEqual([]);
    });

    it('returns suggestedTokens from filtered pending approvals', () => {
      const pendingApprovals = {
        1: {
          id: '1',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x8b175474e89094c44da98b954eedeac495271d0a',
              symbol: 'NEW',
              decimals: 18,
              image: 'metamark.svg',
            },
          },
          requestState: null,
        },
        2: {
          id: '2',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
              symbol: '0XYX',
              decimals: 18,
              image: '0x.svg',
            },
          },
        },
        3: {
          id: '3',
          origin: 'origin',
          time: 1,
          type: ApprovalType.Transaction,
          requestData: {
            // something that is not an asset
          },
        },
        4: {
          id: '4',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x1234abcd',
              symbol: '0XYX',
              tokenId: '123',
            },
          },
        },
      };

      expect(
        selectors.getSuggestedTokens({ metamask: { pendingApprovals } }),
      ).toStrictEqual([
        {
          id: '1',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x8b175474e89094c44da98b954eedeac495271d0a',
              symbol: 'NEW',
              decimals: 18,
              image: 'metamark.svg',
            },
          },
          requestState: null,
        },
        {
          id: '2',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
              symbol: '0XYX',
              decimals: 18,
              image: '0x.svg',
            },
          },
        },
      ]);
    });
  });

  describe('#getSuggestedNfts', () => {
    it('returns an empty array if pendingApprovals is undefined', () => {
      expect(selectors.getSuggestedNfts({ metamask: {} })).toStrictEqual([]);
    });

    it('returns suggestedNfts from filtered pending approvals', () => {
      const pendingApprovals = {
        1: {
          id: '1',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x8b175474e89094c44da98b954eedeac495271d0a',
              symbol: 'NEW',
              decimals: 18,
              image: 'metamark.svg',
            },
          },
          requestState: null,
        },
        2: {
          id: '2',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
              symbol: '0XYX',
              decimals: 18,
              image: '0x.svg',
            },
          },
        },
        3: {
          id: '3',
          origin: 'origin',
          time: 1,
          type: ApprovalType.Transaction,
          requestData: {
            // something that is not an asset
          },
        },
        4: {
          id: '4',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x1234abcd',
              symbol: '0XYX',
              tokenId: '123',
              standard: 'ERC721',
            },
          },
        },
      };

      expect(
        selectors.getSuggestedNfts({ metamask: { pendingApprovals } }),
      ).toStrictEqual([
        {
          id: '4',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x1234abcd',
              symbol: '0XYX',
              tokenId: '123',
              standard: 'ERC721',
            },
          },
        },
      ]);
    });
  });

  describe('#getNewNetworkAdded', () => {
    it('returns undefined if newNetworkAddedName is undefined', () => {
      expect(selectors.getNewNetworkAdded({ appState: {} })).toBeUndefined();
    });

    it('returns newNetworkAddedName', () => {
      expect(
        selectors.getNewNetworkAdded({
          appState: { newNetworkAddedName: 'test-chain' },
        }),
      ).toStrictEqual('test-chain');
    });
  });

  describe('#getRpcPrefsForCurrentProvider', () => {
    it('returns an empty object if state.metamask.providerConfig is empty', () => {
      expect(
        selectors.getRpcPrefsForCurrentProvider({
          metamask: { providerConfig: {} },
        }),
      ).toStrictEqual({});
    });
    it('returns rpcPrefs from the providerConfig', () => {
      expect(
        selectors.getRpcPrefsForCurrentProvider({
          metamask: {
            providerConfig: {
              rpcPrefs: { blockExplorerUrl: 'https://test-block-explorer' },
            },
          },
        }),
      ).toStrictEqual({ blockExplorerUrl: 'https://test-block-explorer' });
    });
  });

  describe('#getNetworksTabSelectedNetworkConfigurationId', () => {
    it('returns undefined if selectedNetworkConfigurationId is undefined', () => {
      expect(
        selectors.getNetworksTabSelectedNetworkConfigurationId({
          appState: {},
        }),
      ).toBeUndefined();
    });

    it('returns selectedNetworkConfigurationId', () => {
      expect(
        selectors.getNetworksTabSelectedNetworkConfigurationId({
          appState: {
            selectedNetworkConfigurationId: 'testNetworkConfigurationId',
          },
        }),
      ).toStrictEqual('testNetworkConfigurationId');
    });
  });

  describe('#getNetworkConfigurations', () => {
    it('returns undefined if state.metamask.networkConfigurations is undefined', () => {
      expect(
        selectors.getNetworkConfigurations({
          metamask: {},
        }),
      ).toBeUndefined();
    });

    it('returns networkConfigurations', () => {
      const networkConfigurations = {
        testNetworkConfigurationId1: {
          rpcUrl: 'https://mock-rpc-url-1',
          chainId: '0xtest',
          ticker: 'TEST',
          id: 'testNetworkConfigurationId1',
        },
        testNetworkConfigurationId2: {
          rpcUrl: 'https://mock-rpc-url-2',
          chainId: '0x1337',
          ticker: 'RPC',
          id: 'testNetworkConfigurationId2',
        },
      };
      expect(
        selectors.getNetworkConfigurations({
          metamask: {
            networkConfigurations,
          },
        }),
      ).toStrictEqual(networkConfigurations);
    });
  });

  describe('#getAllNetworks', () => {
    it('sorts Localhost to the bottom of the test lists', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
          networkConfigurations: {
            'some-config-name': {
              chainId: CHAIN_IDS.LOCALHOST,
              nickname: LOCALHOST_DISPLAY_NAME,
            },
          },
        },
      });
      const lastItem = networks.pop();
      expect(lastItem.nickname.toLowerCase()).toContain('localhost');
    });

    it('properly assigns a network as removable', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
          networkConfigurations: {
            'some-config-name': {
              chainId: CHAIN_IDS.LOCALHOST,
              nickname: LOCALHOST_DISPLAY_NAME,
              id: 'some-config-name',
            },
          },
        },
      });

      const mainnet = networks.find(
        (network) => network.id === NETWORK_TYPES.MAINNET,
      );
      expect(mainnet.removable).toBe(false);

      const customNetwork = networks.find(
        (network) => network.id === 'some-config-name',
      );
      expect(customNetwork.removable).toBe(true);
    });

    it('properly proposes a known network image when not provided by adding function', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
          networkConfigurations: {
            'some-config-name': {
              chainId: CHAIN_IDS.OPTIMISM,
              nickname: OPTIMISM_DISPLAY_NAME,
              id: 'some-config-name',
            },
          },
        },
      });

      const optimismConfig = networks.find(
        ({ chainId }) => chainId === CHAIN_IDS.OPTIMISM,
      );
      expect(optimismConfig.rpcPrefs.imageUrl).toBe('./images/optimism.svg');
    });
  });

  describe('#getCurrentNetwork', () => {
    it('returns the correct custom network when there is a chainId collision', () => {
      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          providerConfig: {
            ...mockState.metamask.networkConfigurations
              .testNetworkConfigurationId,
            // 0x1 would collide with Ethereum Mainnet
            chainId: '0x1',
            // type of "rpc" signals custom network
            type: 'rpc',
          },
        },
      };

      const currentNetwork = selectors.getCurrentNetwork(modifiedMockState);
      expect(currentNetwork.nickname).toBe('Custom Mainnet RPC');
      expect(currentNetwork.chainId).toBe('0x1');
    });

    it('returns the correct mainnet network when there is a chainId collision', () => {
      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          providerConfig: {
            ...mockState.metamask.providerConfig,
            chainId: '0x1',
            // Changing type to 'mainnet' represents Ethereum Mainnet
            type: 'mainnet',
          },
        },
      };
      const currentNetwork = selectors.getCurrentNetwork(modifiedMockState);
      expect(currentNetwork.nickname).toBe('Ethereum Mainnet');
    });
  });

  describe('#getAllEnabledNetworks', () => {
    it('returns only Mainnet and Linea with showTestNetworks off', () => {
      const networks = selectors.getAllEnabledNetworks({
        metamask: {
          preferences: {
            showTestNetworks: false,
          },
        },
      });
      expect(networks).toHaveLength(2);
    });

    it('returns networks with showTestNetworks on', () => {
      const networks = selectors.getAllEnabledNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
        },
      });
      expect(networks.length).toBeGreaterThan(2);
    });
  });

  describe('#isHardwareWallet', () => {
    it('returns false if it is not a HW wallet', () => {
      mockState.metamask.keyrings[0].type = KeyringType.imported;
      expect(selectors.isHardwareWallet(mockState)).toBe(false);
    });

    it('returns true if it is a Ledger HW wallet', () => {
      mockState.metamask.keyrings[0].type = KeyringType.ledger;
      expect(selectors.isHardwareWallet(mockState)).toBe(true);
    });

    it('returns true if it is a Trezor HW wallet', () => {
      mockState.metamask.keyrings[0].type = KeyringType.trezor;
      expect(selectors.isHardwareWallet(mockState)).toBe(true);
    });
  });

  describe('#getHardwareWalletType', () => {
    it('returns undefined if it is not a HW wallet', () => {
      mockState.metamask.keyrings[0].type = KeyringType.imported;
      expect(selectors.getHardwareWalletType(mockState)).toBeUndefined();
    });

    it('returns "Ledger Hardware" if it is a Ledger HW wallet', () => {
      mockState.metamask.keyrings[0].type = KeyringType.ledger;
      expect(selectors.getHardwareWalletType(mockState)).toBe(
        KeyringType.ledger,
      );
    });

    it('returns "Trezor Hardware" if it is a Trezor HW wallet', () => {
      mockState.metamask.keyrings[0].type = KeyringType.trezor;
      expect(selectors.getHardwareWalletType(mockState)).toBe(
        KeyringType.trezor,
      );
    });
  });

  it('returns selected identity', () => {
    expect(selectors.getSelectedIdentity(mockState)).toStrictEqual({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Test Account',
    });
  });

  it('returns selected account', () => {
    const account = selectors.getSelectedAccount(mockState);
    expect(account.balance).toStrictEqual('0x346ba7725f412cbfdb');
    expect(account.address).toStrictEqual(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
  });

  describe('#getTokenExchangeRates', () => {
    it('returns token exchange rates', () => {
      const tokenExchangeRates = selectors.getTokenExchangeRates(mockState);
      expect(tokenExchangeRates).toStrictEqual({
        '0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d': 0.00039345803819379796,
        '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': 0.00008189274407698049,
      });
    });
  });

  describe('#checkNetworkOrAccountNotSupports1559', () => {
    it('returns false if network and account supports EIP-1559', () => {
      const not1559Network = selectors.checkNetworkOrAccountNotSupports1559({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          keyrings: [
            {
              type: KeyringType.ledger,
              accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
            },
          ],
        },
      });
      expect(not1559Network).toStrictEqual(false);
    });

    it('returns true if network does not support EIP-1559', () => {
      let not1559Network = selectors.checkNetworkOrAccountNotSupports1559({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          networksMetadata: {
            [NetworkType.goerli]: {
              EIPS: { 1559: false },
            },
          },
        },
      });
      expect(not1559Network).toStrictEqual(true);
      not1559Network = selectors.checkNetworkOrAccountNotSupports1559({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          networksMetadata: {
            [NetworkType.goerli]: {
              EIPS: { 1559: false },
            },
          },
        },
      });
      expect(not1559Network).toStrictEqual(true);
    });
  });

  describe('#getAddressBook', () => {
    it('should return the address book', () => {
      expect(selectors.getAddressBook(mockState)).toStrictEqual([
        {
          address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          chainId: '0x5',
          isEns: false,
          memo: '',
          name: 'Address Book Account 1',
        },
      ]);
    });
  });

  it('returns accounts with balance, address, and name from identity and accounts in state', () => {
    const accountsWithSendEther =
      selectors.accountsWithSendEtherInfoSelector(mockState);
    expect(accountsWithSendEther).toHaveLength(5);
    expect(accountsWithSendEther[0].balance).toStrictEqual(
      '0x346ba7725f412cbfdb',
    );
    expect(accountsWithSendEther[0].address).toStrictEqual(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(accountsWithSendEther[0].name).toStrictEqual('Test Account');
  });

  it('returns selected account with balance, address, and name from accountsWithSendEtherInfoSelector', () => {
    const currentAccountwithSendEther =
      selectors.getCurrentAccountWithSendEtherInfo(mockState);
    expect(currentAccountwithSendEther.balance).toStrictEqual(
      '0x346ba7725f412cbfdb',
    );
    expect(currentAccountwithSendEther.address).toStrictEqual(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(currentAccountwithSendEther.name).toStrictEqual('Test Account');
  });

  it('#getGasIsLoading', () => {
    const gasIsLoading = selectors.getGasIsLoading(mockState);
    expect(gasIsLoading).toStrictEqual(false);
  });

  it('#getCurrentCurrency', () => {
    const currentCurrency = selectors.getCurrentCurrency(mockState);
    expect(currentCurrency).toStrictEqual('usd');
  });

  it('#getTotalUnapprovedCount', () => {
    const totalUnapprovedCount = selectors.getTotalUnapprovedCount(mockState);
    expect(totalUnapprovedCount).toStrictEqual(1);
  });

  it('#getUseTokenDetection', () => {
    const useTokenDetection = selectors.getUseTokenDetection(mockState);
    expect(useTokenDetection).toStrictEqual(true);
  });

  it('#getTokenList', () => {
    const tokenList = selectors.getTokenList(mockState);
    expect(tokenList).toStrictEqual({
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        symbol: 'WBTC',
        decimals: 8,
        name: 'Wrapped Bitcoin',
        iconUrl: 'https://s3.amazonaws.com/airswap-token-images/WBTC.png',
        aggregators: [
          'airswapLight',
          'bancor',
          'cmc',
          'coinGecko',
          'kleros',
          'oneInch',
          'paraswap',
          'pmm',
          'totle',
          'zapper',
          'zerion',
          'zeroEx',
        ],
        occurrences: 12,
      },
      '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        symbol: 'YFI',
        decimals: 18,
        name: 'yearn.finance',
        iconUrl:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo.png',
        aggregators: [
          'airswapLight',
          'bancor',
          'cmc',
          'coinGecko',
          'kleros',
          'oneInch',
          'paraswap',
          'pmm',
          'totle',
          'zapper',
          'zerion',
          'zeroEx',
        ],
        occurrences: 12,
      },
    });
  });
  it('#getAdvancedGasFeeValues', () => {
    const advancedGasFee = selectors.getAdvancedGasFeeValues(mockState);
    expect(advancedGasFee).toStrictEqual({
      maxBaseFee: '75',
      priorityFee: '2',
    });
  });
  it('#getAppIsLoading', () => {
    const appIsLoading = selectors.getAppIsLoading(mockState);
    expect(appIsLoading).toStrictEqual(false);
  });
  it('#getNotifications', () => {
    const notifications = selectors.getNotifications(mockState);

    expect(notifications).toStrictEqual([
      mockState.metamask.notifications.test,
      mockState.metamask.notifications.test2,
    ]);
  });
  it('#getUnreadNotificationsCount', () => {
    const unreadNotificationCount =
      selectors.getUnreadNotificationsCount(mockState);

    expect(unreadNotificationCount).toStrictEqual(1);
  });

  it('#getUnreadNotifications', () => {
    const unreadNotifications = selectors.getUnreadNotifications(mockState);

    expect(unreadNotifications).toStrictEqual([
      mockState.metamask.notifications.test,
    ]);
  });

  it('#getUseCurrencyRateCheck', () => {
    const useCurrencyRateCheck = selectors.getUseCurrencyRateCheck(mockState);
    expect(useCurrencyRateCheck).toStrictEqual(true);
  });

  it('#getShowOutdatedBrowserWarning returns false if outdatedBrowserWarningLastShown is less than 2 days ago', () => {
    mockState.metamask.showOutdatedBrowserWarning = true;
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - 1);
    mockState.metamask.outdatedBrowserWarningLastShown = timestamp.getTime();
    const showOutdatedBrowserWarning =
      selectors.getShowOutdatedBrowserWarning(mockState);
    expect(showOutdatedBrowserWarning).toStrictEqual(false);
  });

  it('#getShowOutdatedBrowserWarning returns true if outdatedBrowserWarningLastShown is more than 2 days ago', () => {
    mockState.metamask.showOutdatedBrowserWarning = true;
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - 3);
    mockState.metamask.outdatedBrowserWarningLastShown = timestamp.getTime();
    const showOutdatedBrowserWarning =
      selectors.getShowOutdatedBrowserWarning(mockState);
    expect(showOutdatedBrowserWarning).toStrictEqual(true);
  });

  it('#getTotalUnapprovedSignatureRequestCount', () => {
    const totalUnapprovedSignatureRequestCount =
      selectors.getTotalUnapprovedSignatureRequestCount(mockState);
    expect(totalUnapprovedSignatureRequestCount).toStrictEqual(0);
  });

  it('#getIsDesktopEnabled', () => {
    const isDesktopEnabled = selectors.getIsDesktopEnabled(mockState);
    expect(isDesktopEnabled).toBeFalsy();
  });

  it('#getIsBridgeChain', () => {
    mockState.metamask.providerConfig.chainId = '0xa';
    const isOptimismSupported = selectors.getIsBridgeChain(mockState);
    expect(isOptimismSupported).toBeTruthy();

    mockState.metamask.providerConfig.chainId = '0xfa';
    const isFantomSupported = selectors.getIsBridgeChain(mockState);
    expect(isFantomSupported).toBeFalsy();
  });

  it('returns proper values for snaps privacy warning shown status', () => {
    mockState.metamask.snapsInstallPrivacyWarningShown = false;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(false);

    mockState.metamask.snapsInstallPrivacyWarningShown = true;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(true);

    mockState.metamask.snapsInstallPrivacyWarningShown = undefined;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(false);

    mockState.metamask.snapsInstallPrivacyWarningShown = null;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(false);
  });

  it('#getInfuraBlocked', () => {
    let isInfuraBlocked = selectors.getInfuraBlocked(mockState);
    expect(isInfuraBlocked).toBe(false);

    const modifiedMockState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        networksMetadata: {
          ...mockState.metamask.networksMetadata,
          goerli: {
            status: 'blocked',
          },
        },
      },
    };
    isInfuraBlocked = selectors.getInfuraBlocked(modifiedMockState);
    expect(isInfuraBlocked).toBe(true);
  });

  it('#getSnapRegistryData', () => {
    const mockSnapId = 'npm:@metamask/test-snap-bip44';
    expect(selectors.getSnapRegistryData(mockState, mockSnapId)).toStrictEqual(
      expect.objectContaining({
        id: mockSnapId,
        versions: {
          '5.1.2': {
            checksum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
          '5.1.3': {
            checksum: '21k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
          '6.0.0': {
            checksum: '31k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
        },
        metadata: expect.objectContaining({
          website: 'https://snaps.consensys.io/',
          name: 'BIP-44',
        }),
      }),
    );
  });

  it('#getSnapLatestVersion', () => {
    const mockSnapId = 'npm:@metamask/test-snap-bip44';
    expect(selectors.getSnapLatestVersion(mockState, mockSnapId)).toStrictEqual(
      '6.0.0',
    );
  });

  it('#getAllSnapAvailableUpdates', () => {
    const snapMap = selectors.getAllSnapAvailableUpdates(mockState);
    expect(Object.fromEntries(snapMap)).toStrictEqual({
      'npm:@metamask/test-snap-bip44': true,
    });
  });

  it('#getAnySnapUpdateAvailable', () => {
    expect(selectors.getAnySnapUpdateAvailable(mockState)).toStrictEqual(true);
  });
});
