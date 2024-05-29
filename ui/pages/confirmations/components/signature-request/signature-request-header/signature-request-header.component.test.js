import React from 'react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import SignatureRequestHeader from './signature-request-header.component';

describe('SignatureRequestHeader', () => {
  const store = configureMockStore()(mockState);
  it('renders correctly with fromAccount', () => {
    const fromAccount = {
      address: 'mockAddress',
      balance: 'mockBalance',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'mockName',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: [...Object.values(EthMethod)],
      type: EthAccountType.Eoa,
    };

    const { container } = renderWithProvider(
      <SignatureRequestHeader fromAccount={fromAccount} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly without fromAccount', () => {
    const { container } = renderWithProvider(<SignatureRequestHeader />, store);
    expect(container).toMatchSnapshot();
  });
});
