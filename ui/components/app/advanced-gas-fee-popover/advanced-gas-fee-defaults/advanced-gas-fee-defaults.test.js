import React from 'react';
import { screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';

import { AdvanceGasFeePopoverContextProvider } from '../context';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';

import AdvancedGasFeeInputs from '../advanced-gas-fee-inputs';
import AdvancedGasFeeDefaults from './advanced-gas-fee-defaults';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

const render = (defaultGasParams) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...defaultGasParams,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET].gasFeeEstimates,
    },
  });
  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        userFeeLevel: 'custom',
        txParams: {
          maxFeePerGas: '0x174876E800',
          maxPriorityFeePerGas: '0x77359400',
        },
      }}
    >
      <AdvanceGasFeePopoverContextProvider>
        <AdvancedGasFeeInputs />
        <AdvancedGasFeeDefaults />
      </AdvanceGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};
describe('AdvancedGasFeeDefaults', () => {
  it('should renders correct message when the default is not set', () => {
    render({ advancedGasFee: null });

    expect(
      screen.queryByText(
        'Use the “new values” and advanced setting as default.',
      ),
    ).toBeInTheDocument();
  });
  it('should renders correct message when the default values are set', () => {
    render({
      advancedGasFee: { maxBaseFee: 2, priorityFee: 2 },
    });

    expect(
      screen.queryByText(
        'Always use these values and advanced setting as default.',
      ),
    ).toBeInTheDocument();
  });
});
