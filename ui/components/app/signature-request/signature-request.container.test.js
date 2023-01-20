import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SignatureRequest from './signature-request.container';

describe('Signature Request', () => {
  const mockStore = {
    metamask: {
      tokenList: {
        '0x514910771af9ca656af840dff83e8264ecf986ca': {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          name: 'ChainLink Token',
          iconUrl:
            'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
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
      provider: {
        type: 'rpc',
      },
      accounts: {
        '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': {
          address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
          balance: '0x03',
        },
      },
      cachedBalances: {},
      selectedAddress: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    },
  };
  const store = configureMockStore()(mockStore);

  const props = {
    fromAccount: {
      address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
    },
    history: {
      push: sinon.spy(),
    },
    hardwareWalletRequiresConnection: false,
    clearConfirmTransaction: sinon.spy(),
    cancelMessage: sinon.spy(),
    cancel: sinon.stub().resolves(),
    provider: {
      type: 'rpc',
    },
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
  };

  let rerender;

  beforeEach(() => {
    rerender = renderWithProvider(
      <SignatureRequest.WrappedComponent {...props} />,
      store,
    ).rerender;
  });

  afterEach(() => {
    props.clearConfirmTransaction.resetHistory();
  });

  it('cancel', () => {
    const cancelButton = screen.getByTestId('signature-cancel-button');

    fireEvent.click(cancelButton);

    expect(props.cancel.calledOnce).toStrictEqual(true);
  });

  it('sign', () => {
    const signButton = screen.getByTestId('signature-sign-button');

    fireEvent.click(signButton);

    expect(props.sign.calledOnce).toStrictEqual(true);
  });

  it('have user warning', () => {
    const warningText = screen.getByText(
      'Only sign this message if you fully understand the content and trust the requesting site.',
    );

    expect(warningText).toBeInTheDocument();
  });

  it('shows verify contract details link when verifyingContract is set', () => {
    const verifyingContractLink = screen.getByTestId('verify-contract-details');

    expect(verifyingContractLink).toBeInTheDocument();
  });

  it('does not show verify contract details link when verifyingContract is not set', () => {
    const newData = JSON.parse(props.txData.msgParams.data);
    delete newData.domain.verifyingContract;

    const newProps = {
      ...props,
      txData: {
        ...props.txData,
        msgParams: {
          ...props.txData.msgParams,
          data: JSON.stringify(newData),
        },
      },
    };

    rerender(<SignatureRequest.WrappedComponent {...newProps} />, store);

    expect(screen.queryByTestId('verify-contract-details')).toBeNull();
  });
});
