import React from 'react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component';

const baseProps = {
  clearConfirmTransaction: () => undefined,
  cancelEncryptionPublicKey: () => undefined,
  encryptionPublicKey: () => undefined,
  mostRecentOverviewPage: '/',
  history: { push: '/' },
  requesterAddress: '0x123456789abcdef',
  txData: {
    origin: 'test',
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
    name: 'Antonio',
  },
};

describe('ConfirmDecryptMessage Component', () => {
  const store = configureMockStore()(mockState);

  it('should match snapshot when preference is ETH currency', () => {
    const { container } = renderWithProvider(
      <ConfirmEncryptionPublicKey {...baseProps} conversionRate={null} />,
      store,
    );

    expect(container).toMatchSnapshot();
    expect(
      container.querySelector('.request-encryption-public-key__balance-value')
        .textContent,
    ).toMatchInlineSnapshot(`"966.987986 ABC"`);
  });

  it('should match snapshot when preference is Fiat currency', () => {
    const { container } = renderWithProvider(
      <ConfirmEncryptionPublicKey {...baseProps} conversionRate={1572.88} />,
      store,
    );

    expect(container).toMatchSnapshot();
    expect(
      container.querySelector('.request-encryption-public-key__balance-value')
        .textContent,
    ).toMatchInlineSnapshot(`"1520956.064158 DEF"`);
  });

  it('should match snapshot when there is no txData', () => {
    const newProps = {
      ...baseProps,
      txData: null,
    };
    const { container } = renderWithProvider(
      <ConfirmEncryptionPublicKey {...newProps} conversionRate={1572.88} />,
      store,
    );

    expect(
      container.querySelector('.request-decrypt-message__container'),
    ).toBeNull();
  });
});
