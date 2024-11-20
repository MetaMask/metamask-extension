import React from 'react';
import configureMockStore from 'redux-mock-store';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

import { mockNetworkState } from '../../../../../test/stub/networks';
import SignatureRequestHeader from '.';

const CHAIN_ID_MOCK = CHAIN_IDS.GOERLI;

const props = {
  txData: {
    chainId: CHAIN_ID_MOCK,
    msgParams: {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    },
  },
};

describe('SignatureRequestHeader', () => {
  const store = configureMockStore()({
    ...mockState,
    ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <SignatureRequestHeader {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
