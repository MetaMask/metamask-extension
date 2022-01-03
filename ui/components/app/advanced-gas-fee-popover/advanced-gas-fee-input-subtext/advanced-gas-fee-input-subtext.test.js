import React from 'react';
import { screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../../shared/constants/gas';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import AdvancedGasFeeInputSubtext from './advanced-gas-fee-input-subtext';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      advancedGasFee: { priorityFee: 100 },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET].gasFeeEstimates,
    },
  });

  return renderWithProvider(
    <AdvancedGasFeeInputSubtext
      latest="Latest Value"
      historical="Historical value"
      feeTrend="up"
    />,
    store,
  );
};

describe('AdvancedGasFeeInputSubtext', () => {
  it('should renders latest and historical values passed', () => {
    render();

    expect(screen.queryByText('Latest Value')).toBeInTheDocument();
    expect(screen.queryByText('Historical value')).toBeInTheDocument();
    expect(screen.queryByAltText('feeTrend-arrow')).toBeInTheDocument();
  });
});
