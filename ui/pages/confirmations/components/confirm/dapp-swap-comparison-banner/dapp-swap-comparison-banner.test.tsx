import React from 'react';
import configureMockStore from 'redux-mock-store';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapComparisonInfo } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo';
import { DappSwapComparisonBanner } from './dapp-swap-comparison-banner';

jest.mock(
  '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo',
  () => ({
    useDappSwapComparisonInfo: jest.fn(() => ({
      selectedQuote: { destTokenAmount: 100 },
    })),
  }),
);

jest.mock('../../../../../selectors/remote-feature-flags');

function render(args: Record<string, string> = {}) {
  const state = getMockConfirmStateForTransaction({
    ...mockSwapConfirmation,
    ...args,
  } as Confirmation);

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <DappSwapComparisonBanner />,
    mockStore,
  );
}

describe('<DappSwapComparisonBanner />', () => {
  const mockGetRemoteFeatureFlags = jest.mocked(getRemoteFeatureFlags);
  const mockUseDappSwapComparisonInfo = jest.mocked(useDappSwapComparisonInfo);

  beforeEach(() => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      dappSwapMetrics: { enabled: true },
    });
  });

  it('renders component without errors', () => {
    const { getByText } = render();
    expect(getByText('Current')).toBeInTheDocument();
    expect(getByText('Save + Earn')).toBeInTheDocument();
  });

  it('renders undefined for incorrect origin', () => {
    const { container } = render({ origin: 'www.test.com' });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders undefined if suitable quote is not found', () => {
    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuote: undefined,
    });
    const { container } = render();
    expect(container).toBeEmptyDOMElement();
  });
});
