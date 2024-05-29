import React from 'react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import ConfirmDecryptMessage from './confirm-decrypt-message.component';

const messageData = {
  domain: {
    chainId: 97,
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1',
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallets: [
        '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
      ],
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000',
        ],
      },
    ],
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' },
    ],
  },
};
const baseProps = {
  clearConfirmTransaction: () => undefined,
  cancelDecryptMessage: () => undefined,
  decryptMessage: () => undefined,
  decryptMessageInline: () => undefined,
  mostRecentOverviewPage: '/',
  history: { push: '/' },
  requesterAddress: '0x123456789abcdef',
  txData: {
    msgParams: {
      data: JSON.stringify(messageData),
      version: 'V4',
      origin: 'test',
    },
  },
  subjectMetadata: {
    'peepeth.com': {
      iconUrl: 'https://peepeth.com/favicon-32x32.png',
      name: 'Peepeth',
    },
    'https://remix.ethereum.org': {
      iconUrl: 'https://remix.ethereum.org/icon.png',
      name: 'Remix - Ethereum IDE',
    },
  },
  nativeCurrency: 'ABC',
  currentCurrency: 'def',
  fromAccount: {
    address: '0x123456789abcdef',
    balance: '0x346ba7725f412cbfdb',
    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    metadata: {
      name: 'Antonio',
      keyring: {
        type: 'HD Key Tree',
      },
    },
    options: {},
    methods: [...Object.values(EthMethod)],
    type: EthAccountType.Eoa,
  },
};

describe('ConfirmDecryptMessage Component', () => {
  const store = configureMockStore()(mockState);

  it('should match snapshot when preference is ETH currency', () => {
    const { container } = renderWithProvider(
      <ConfirmDecryptMessage {...baseProps} conversionRate={null} />,
      store,
    );

    expect(container).toMatchSnapshot();
    expect(
      container.querySelector('.request-decrypt-message__balance-value')
        .textContent,
    ).toMatchInlineSnapshot(`"966.987986 ABC"`);
  });

  it('should match snapshot when preference is Fiat currency', () => {
    const { container } = renderWithProvider(
      <ConfirmDecryptMessage {...baseProps} conversionRate={1572.88} />,
      store,
    );

    expect(container).toMatchSnapshot();
    expect(
      container.querySelector('.request-decrypt-message__balance-value')
        .textContent,
    ).toMatchInlineSnapshot(`"1520956.064158 DEF"`);
  });

  it('should match snapshot when there is no txData', () => {
    const newProps = {
      ...baseProps,
      txData: null,
    };
    const { container } = renderWithProvider(
      <ConfirmDecryptMessage {...newProps} conversionRate={1572.88} />,
      store,
    );

    expect(
      container.querySelector('.request-decrypt-message__container'),
    ).toBeNull();
  });
});
