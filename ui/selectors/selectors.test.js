import mockState from '../../test/data/mock-state.json';
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

  describe('#isHardwareWallet', () => {
    it('returns false if it is not a HW wallet', () => {
      mockState.metamask.keyrings[0].type = 'Simple Key Pair';
      expect(selectors.isHardwareWallet(mockState)).toBe(false);
    });

    it('returns true if it is a Ledger HW wallet', () => {
      mockState.metamask.keyrings[0].type = 'Ledger Hardware';
      expect(selectors.isHardwareWallet(mockState)).toBe(true);
    });

    it('returns true if it is a Trezor HW wallet', () => {
      mockState.metamask.keyrings[0].type = 'Trezor Hardware';
      expect(selectors.isHardwareWallet(mockState)).toBe(true);
    });
  });

  describe('#getHardwareWalletType', () => {
    it('returns undefined if it is not a HW wallet', () => {
      mockState.metamask.keyrings[0].type = 'Simple Key Pair';
      expect(selectors.getHardwareWalletType(mockState)).toBeUndefined();
    });

    it('returns "Ledger Hardware" if it is a Ledger HW wallet', () => {
      mockState.metamask.keyrings[0].type = 'Ledger Hardware';
      expect(selectors.getHardwareWalletType(mockState)).toBe(
        'Ledger Hardware',
      );
    });

    it('returns "Trezor Hardware" if it is a Trezor HW wallet', () => {
      mockState.metamask.keyrings[0].type = 'Trezor Hardware';
      expect(selectors.getHardwareWalletType(mockState)).toBe(
        'Trezor Hardware',
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
    expect(account.balance).toStrictEqual('0x0');
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

  describe('#getAddressBook', () => {
    it('should return the address book', () => {
      expect(selectors.getAddressBook(mockState)).toStrictEqual([
        {
          address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          chainId: '0x4',
          isEns: false,
          memo: '',
          name: 'Address Book Account 1',
        },
      ]);
    });
  });

  it('returns accounts with balance, address, and name from identity and accounts in state', () => {
    const accountsWithSendEther = selectors.accountsWithSendEtherInfoSelector(
      mockState,
    );
    expect(accountsWithSendEther).toHaveLength(2);
    expect(accountsWithSendEther[0].balance).toStrictEqual('0x0');
    expect(accountsWithSendEther[0].address).toStrictEqual(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(accountsWithSendEther[0].name).toStrictEqual('Test Account');
  });

  it('returns selected account with balance, address, and name from accountsWithSendEtherInfoSelector', () => {
    const currentAccountwithSendEther = selectors.getCurrentAccountWithSendEtherInfo(
      mockState,
    );
    expect(currentAccountwithSendEther.balance).toStrictEqual('0x0');
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

  it('#getUseStaticTokenList', () => {
    const useStaticTokenList = selectors.getUseStaticTokenList(mockState);
    expect(useStaticTokenList).toStrictEqual(false);
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
});
