import React from 'react';
import configureMockStore from 'redux-mock-store';
import { NetworkStatus } from '@metamask/network-controller';
import { NetworkType } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import ConfirmDetailRow from '.';

describe('Confirm Detail Row Component', () => {
  const mockState = {
    metamask: {
      currencyRates: {},
      providerConfig: {
        chainId: CHAIN_IDS.GOERLI,
        nickname: GOERLI_DISPLAY_NAME,
        type: NETWORK_TYPES.GOERLI,
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      selectedNetworkClientId: NetworkType.mainnet,
      networksMetadata: {
        [NetworkType.mainnet]: {
          EIPS: {},
          status: NetworkStatus.Available,
        },
      },
    },
  };

  const store = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<ConfirmDetailRow />, store);

    expect(container).toMatchSnapshot();
  });
});
