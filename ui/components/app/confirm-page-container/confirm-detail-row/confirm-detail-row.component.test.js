import React from 'react';
import configureMockStore from 'redux-mock-store';

import { NetworkStatus } from '@metamask/network-controller';
import { NetworkType } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import ConfirmDetailRow from '.';

describe('Confirm Detail Row Component', () => {
  const mockState = {
    metamask: {
      providerConfig: {
        type: 'rpc',
        chainId: '0x5',
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
