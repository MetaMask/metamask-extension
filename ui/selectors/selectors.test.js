import mockState from '../../test/data/mock-state.json';
import {
  HardwareKeyringType,
  HardwareDeviceNames,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import {
  CHAIN_IDS,
  LOCALHOST_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
} from '../../shared/constants/network';
import * as selectors from './selectors';

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
    it('returns an empty object if state.metamask.provider is undefined', () => {
      expect(
        selectors.getRpcPrefsForCurrentProvider({ metamask: {} }),
      ).toStrictEqual({});
    });
    it('returns rpcPrefs from the provider', () => {
      expect(
        selectors.getRpcPrefsForCurrentProvider({
          metamask: {
            provider: {
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
    it('returns an array even if there are no custom networks', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: false,
          },
        },
      });
      expect(networks instanceof Array).toBe(true);
      // The only returning item should be Ethereum Mainnet
      expect(networks).toHaveLength(1);
      expect(networks[0].nickname).toStrictEqual(MAINNET_DISPLAY_NAME);
    });

    it('returns more test networks with showTestNetworks on', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
        },
      });
      expect(networks.length).toBeGreaterThan(1);
    });

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

  describe('#getHardwareWalletDevice', () => {
    it('returns undefined if it is not a HW wallet', () => {
      mockState.metamask.keyrings[0].type = HardwareKeyringType.imported;
      expect(selectors.getHardwareWalletDevice(mockState)).toBeUndefined();
    });

    it('returns "ledger" if it is a Ledger HW wallet', () => {
      mockState.metamask.keyrings[0].type = HardwareKeyringType.ledger;
      expect(selectors.getHardwareWalletDevice(mockState)).toBe(
        HardwareDeviceNames.ledger,
      );
    });

    it('returns "trezor" if it is a Trezor HW wallet', () => {
      mockState.metamask.keyrings[0].type = HardwareKeyringType.trezor;
      expect(selectors.getHardwareWalletDevice(mockState)).toBe(
        HardwareDeviceNames.trezor,
      );
    });

    it('returns "lattice" if it is a Lattice HW wallet', () => {
      mockState.metamask.keyrings[0].type = HardwareKeyringType.lattice;
      expect(selectors.getHardwareWalletDevice(mockState)).toBe(
        HardwareDeviceNames.lattice,
      );
    });

    it('returns "QR Hardware" if it is a QR HW wallet', () => {
      mockState.metamask.keyrings[0].type = HardwareKeyringType.qr;
      expect(selectors.getHardwareWalletDevice(mockState)).toBe(
        HardwareDeviceNames.qr,
      );
    });
  });

  describe('#getHardwareWalletPath', () => {
    it('returns undefined if it is not a HW wallet', () => {
      mockState.metamask.keyrings[0].type = HardwareKeyringType.imported;
      expect(selectors.getHardwareWalletPath(mockState)).toBeUndefined();
    });

    it('returns default path if path not set', () => {
      const hdPath = 'defaultpath';
      mockState.metamask.keyrings[0].type = HardwareKeyringType.trezor;
      mockState.appState.defaultHdPaths = { trezor: hdPath };
      expect(selectors.getHardwareWalletPath(mockState)).toStrictEqual(hdPath);
    });

    it('returns stored path if path set', () => {
      const hdPath = 'storedpath';
      mockState.metamask.keyrings[0].type = HardwareKeyringType.ledger;
      mockState.metamask.keyrings[0].hdPath = hdPath;
      expect(selectors.getHardwareWalletPath(mockState)).toStrictEqual(hdPath);
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
          networkDetails: {
            EIPS: { 1559: false },
          },
        },
      });
      expect(not1559Network).toStrictEqual(true);
      not1559Network = selectors.checkNetworkOrAccountNotSupports1559({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          networkDetails: {
            EIPS: { 1559: false },
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
    expect(accountsWithSendEther).toHaveLength(4);
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
  it('#getIsAdvancedGasFeeDefault', () => {
    const isAdvancedGasFeeDefault =
      selectors.getIsAdvancedGasFeeDefault(mockState);
    expect(isAdvancedGasFeeDefault).toStrictEqual(true);
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
    mockState.metamask.provider.chainId = '0xa';
    const isOptimismSupported = selectors.getIsBridgeChain(mockState);
    expect(isOptimismSupported).toBeTruthy();

    mockState.metamask.provider.chainId = '0xfa';
    const isFantomSupported = selectors.getIsBridgeChain(mockState);
    expect(isFantomSupported).toBeFalsy();
  });

  it('#getIsBridgeToken', () => {
    mockState.metamask.provider.chainId = '0xa';
    const isOptimismTokenSupported = selectors.getIsBridgeToken(
      '0x94B008aa00579c1307b0ef2c499ad98a8ce58e58',
    )(mockState);
    expect(isOptimismTokenSupported).toBeTruthy();

    const isOptimismUnknownTokenSupported = selectors.getIsBridgeToken(
      '0x94B008aa00579c1307b0ef2c499ad98a8ce58e60',
    )(mockState);
    expect(isOptimismUnknownTokenSupported).toBeFalsy();

    mockState.metamask.provider.chainId = '0xfa';
    const isFantomTokenSupported = selectors.getIsBridgeToken(
      '0x94B008aa00579c1307b0ef2c499ad98a8ce58e58',
    )(mockState);
    expect(isFantomTokenSupported).toBeFalsy();
  });
});
