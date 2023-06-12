import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SignatureRequest from './signature-request.container';

const mockStoreWithEth = {
  metamask: {
    tokenList: {
      '0x514910771af9ca656af840dff83e8264ecf986ca': {
        address: '0x514910771af9ca656af840dff83e8264ecf986ca',
        symbol: 'LINK',
        decimals: 18,
        name: 'ChainLink Token',
        iconUrl: 'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        occurrences: 12,
        unlisted: false,
      },
    },
    identities: {
      '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e': {
        name: 'Account 2',
        address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
      },
    },
    addressBook: {
      undefined: {
        0: {
          address: '0x39a4e4Af7cCB654dB9500F258c64781c8FbD39F0',
          name: '',
          isEns: false,
        },
      },
    },
    providerConfig: {
      type: 'rpc',
    },
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    accounts: {
      '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': {
        address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        balance: '0x03',
      },
    },
    cachedBalances: {},
    unapprovedDecryptMsgs: {},
    unapprovedEncryptionPublicKeyMsgs: {},
    unconfirmedTransactions: {},
    selectedAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    nativeCurrency: 'ETH',
    currentCurrency: 'usd',
    conversionRate: 231.06,
  },
};

const mockStoreWithFiat = {
  ...mockStoreWithEth,
  preferences: {
    useNativeCurrencyAsPrimaryCurrency: false,
  },
};
describe('Signature Request', () => {
  const propsWithEth = {
    fromAccount: {
      address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
      balance: '0x346ba7725f412cbfdb',
      name: 'John Doe',
    },
    history: {
      push: sinon.spy(),
    },
    hardwareWalletRequiresConnection: false,
    mostRecentOverviewPage: '/',
    clearConfirmTransaction: sinon.spy(),
    cancelMessage: sinon.spy(),
    cancel: sinon.stub().resolves(),
    showRejectTransactionsConfirmationModal: sinon.stub().resolves(),
    cancelAll: sinon.stub().resolves(),
    providerConfig: {
      type: 'rpc',
    },
    unapprovedMessagesCount: 2,
    sign: sinon.stub().resolves(),
    txData: {
      msgParams: {
        id: 1,
        data: '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Person":[{"name":"name","type":"string"},{"name":"wallet","type":"address"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person"},{"name":"contents","type":"string"}]},"primaryType":"Mail","domain":{"name":"Ether Mail","version":"1","chainId":"4","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},"message":{"from":{"name":"Cow","wallet":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},"to":{"name":"Bob","wallet":"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},"contents":"Hello, Bob!"}}',
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        origin: 'test.domain',
      },
      status: 'unapproved',
      time: 1,
      type: 'eth_sign',
    },
    nativeCurrency: 'ETH',
    currentCurrency: 'usd',
    conversionRate: null,
    selectedAccount: {
      address: '0x123456789abcdef',
    },
  };

  const propsWithFiat = {
    ...propsWithEth,
    conversionRate: 156.72,
  };

  describe('Render with different currencies', () => {
    it('should render balance with ETH when conversionRate is not provided', () => {
      const store = configureMockStore()(mockStoreWithEth);
      renderWithProvider(
        <SignatureRequest.WrappedComponent {...propsWithEth} />,
        store,
      );
      expect(
        screen.getByTestId('request-signature-account').textContent,
      ).toMatchInlineSnapshot(
        `"UUnknown private networkJohn DoeBalance966.987986 ETH"`,
      );
    });

    it('should render balance with fiat when conversionRate not provided', () => {
      const store = configureMockStore()(mockStoreWithFiat);
      renderWithProvider(
        <SignatureRequest.WrappedComponent {...propsWithFiat} />,
        store,
      );
      expect(
        screen.getByTestId('request-signature-account').textContent,
      ).toMatchInlineSnapshot(
        `"UUnknown private networkJohn DoeBalance$151,546.36 USD"`,
      );
    });
  });

  describe('functionality check', () => {
    beforeEach(() => {
      const store = configureMockStore()(mockStoreWithFiat);
      renderWithProvider(
        <SignatureRequest.WrappedComponent {...propsWithFiat} />,
        store,
      );
    });

    afterEach(() => {
      propsWithFiat.clearConfirmTransaction.resetHistory();
    });

    it('cancel', () => {
      const cancelButton = screen.getByTestId('page-container-footer-cancel');
      fireEvent.click(cancelButton);
      expect(propsWithFiat.cancel.calledOnce).toStrictEqual(true);
    });

    it('sign', () => {
      const signButton = screen.getByTestId('page-container-footer-next');
      fireEvent.click(signButton);
      expect(propsWithFiat.sign.calledOnce).toStrictEqual(true);
    });

    it('cancelAll', () => {
      const cancelAll = screen.getByTestId('signature-request-reject-all');
      fireEvent.click(cancelAll);
      expect(propsWithFiat.cancelAll.calledOnce).toStrictEqual(false);
    });

    it('have user warning', () => {
      const warningText = screen.getByText(
        'Only sign this message if you fully understand the content and trust the requesting site.',
      );

      expect(warningText).toBeInTheDocument();
    });
  });

  describe('contract details', () => {
    let store;
    beforeEach(() => {
      store = configureMockStore()(mockStoreWithFiat);
    });
    it('shows verify contract details link when verifyingContract is set', () => {
      renderWithProvider(
        <SignatureRequest.WrappedComponent {...propsWithFiat} />,
        store,
      );
      const verifyingContractLink = screen.getByTestId(
        'verify-contract-details',
      );
      expect(verifyingContractLink).toBeInTheDocument();
    });

    it('should not show verify contract details link when verifyingContract is not set', () => {
      const newData = JSON.parse(propsWithFiat.txData.msgParams.data);
      delete newData.domain.verifyingContract;

      const newProps = {
        ...propsWithFiat,
        txData: {
          ...propsWithFiat.txData,
          msgParams: {
            ...propsWithFiat.txData.msgParams,
            data: JSON.stringify(newData),
          },
        },
      };

      renderWithProvider(
        <SignatureRequest.WrappedComponent {...newProps} />,
        store,
      );

      expect(screen.queryByTestId('verify-contract-details')).toBeNull();
    });
  });
});
