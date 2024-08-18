import React from 'react';
import configureMockStore from 'redux-mock-store';
import defaultMockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import ConfirmDetailRow from '.';

describe('Confirm Detail Row Component', () => {
  const mockState = {
    metamask: {
      currencyRates: {},
      ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      internalAccounts: defaultMockState.metamask.internalAccounts,
    },
  };

  const store = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<ConfirmDetailRow />, store);

    expect(container).toMatchSnapshot();
  });
});
