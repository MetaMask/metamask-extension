import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import CancelTransactionGasFee from './cancel-transaction-gas-fee.component';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from 'shared/constants/network';

describe('CancelTransactionGasFee Component', () => {
  const mockState = {
    metamask: {
      providerConfig: {
        chainId: CHAIN_IDS.GOERLI,
        nickname: GOERLI_DISPLAY_NAME,
        type: NETWORK_TYPES.GOERLI,
      },
      currencyRates: {},
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
