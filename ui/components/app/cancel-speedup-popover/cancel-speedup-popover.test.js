import React from 'react';
import { act, screen } from '@testing-library/react';

import {
  EDIT_GAS_MODES,
  GAS_ESTIMATE_TYPES,
} from '../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';

import CancelSpeedupPopover from './cancel-speedup-popover';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  updateTransaction: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
}));

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: () => ({
    closeModal: () => undefined,
    currentModal: 'cancelSpeedUpTransaction',
  }),
}));

const render = (props) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
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
        userFeeLevel: 'tenPercentIncreased',
        txParams: {
          gas: '0x5208',
          maxFeePerGas: '0x59682f10',
          maxPriorityFeePerGas: '0x59682f00',
        },
      }}
      editGasMode={EDIT_GAS_MODES.CANCEL}
      {...props}
    >
      <CancelSpeedupPopover />
    </GasFeeContextProvider>,
    store,
  );
};

describe('CancelSpeedupPopover', () => {
  it('should have ❌Cancel in header if editGasMode is cancel', async () => {
    await act(async () => render());
    expect(screen.queryByText('❌Cancel')).toBeInTheDocument();
  });

  it('should have 🚀Speed Up in header if editGasMode is speedup', async () => {
    await act(async () => render({ editGasMode: EDIT_GAS_MODES.SPEED_UP }));
    expect(screen.queryByText('🚀Speed Up')).toBeInTheDocument();
  });

  it('should show correct gas values', async () => {
    await act(async () =>
      render({
        editGasMode: EDIT_GAS_MODES.SPEED_UP,
      }),
    );
    expect(screen.queryAllByTitle('0.0000315 ETH').length).toBeGreaterThan(0);
  });
});
