import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import CancelTransactionGasFee from './cancel-transaction-gas-fee.component';

describe('CancelTransactionGasFee Component', () => {
  const mockState = {
    metamask: {
      providerConfig: {
        chainId: '0x4',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: false,
      },
    },
  };

  const mockStore = configureMockStore()(mockState);

  it('should render', () => {
    const props = {
      value: '0x3b9aca00',
    };

    const { container } = renderWithProvider(
      <CancelTransactionGasFee {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
