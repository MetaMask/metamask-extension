import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import SignatureRequestHeader from './signature-request-header.component';

describe('SignatureRequestHeader', () => {
  const store = configureMockStore()(mockState);
  it('renders correctly with fromAccount', () => {
    const fromAccount = { address: '0x' };

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
