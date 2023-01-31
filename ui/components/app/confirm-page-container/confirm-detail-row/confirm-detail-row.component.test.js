import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import ConfirmDetailRow from '.';

describe('Confirm Detail Row Component', () => {
  const mockState = {
    metamask: {
      provider: {
        type: 'rpc',
        chainId: '0x5',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
  };

  const store = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<ConfirmDetailRow />, store);

    expect(container).toMatchSnapshot();
  });
});
