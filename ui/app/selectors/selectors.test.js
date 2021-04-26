import mockState from '../../../test/data/mock-state.json';
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
});
