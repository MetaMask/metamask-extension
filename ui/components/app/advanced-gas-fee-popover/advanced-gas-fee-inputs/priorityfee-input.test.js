import React from 'react';

import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';

import { GAS_ESTIMATE_TYPES } from '../../../../../shared/constants/gas';
import PriprityfeeInput from './priorityfee-input';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

const render = (txProps) => {
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
      gasFeeEstimates: mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET],
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        txParams: {
          userFeeLevel: 'high',
        },
        ...txProps,
      }}
    >
      <PriprityfeeInput />
    </GasFeeContextProvider>,
    store,
  );
};

describe('PriprityfeeInput', () => {
  it('should renders advancedGasFee value if current estimate used is not custom', () => {
    render();
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should renders priorityfee values from transaction if current estimate used is custom', () => {
    render({
      txParams: {
        maxFeePerGas: '0x77359400',
        maxPriorityFeePerGas: '0x77359400',
      },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(2);
  });
});
