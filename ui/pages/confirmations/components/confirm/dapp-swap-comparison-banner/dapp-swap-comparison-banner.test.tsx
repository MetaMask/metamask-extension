import React from 'react';
import configureMockStore from 'redux-mock-store';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { DappSwapComparisonBanner } from './dapp-swap-comparison-banner';

jest.mock('../../../hooks/transactions/useDappSwapComparisonInfo', () => ({
  useDappSwapComparisonInfo: jest.fn(() => undefined),
}));

function render() {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation(),
  );

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <DappSwapComparisonBanner />,
    mockStore,
  );
}

describe('<DappSwapComparisonBanner />', () => {
  it('renders component without errors', () => {
    const { container } = render();
    expect(container).toBeEmptyDOMElement();
  });
});
