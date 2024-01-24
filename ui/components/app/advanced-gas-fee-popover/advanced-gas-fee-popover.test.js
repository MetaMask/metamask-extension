import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { GasEstimateTypes } from '../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import { MAX_GAS_LIMIT_DEC } from '../../../pages/send/send.constants';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';

import AdvancedGasFeePopover from './advanced-gas-fee-popover';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
}));

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: () => ({
    closeModal: () => undefined,
    currentModal: 'advancedGasFee',
  }),
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
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        userFeeLevel: 'high',
        txParams: { gas: '0x5208' },
      }}
    >
      <AdvancedGasFeePopover />
    </GasFeeContextProvider>,
    store,
  );
};

describe('AdvancedGasFeePopover', () => {
  it('should renders save button enabled by default', () => {
    render();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeDisabled();
  });

  it('should enable save button if priority fee 0 is entered', () => {
    render();
    fireEvent.change(document.getElementsByTagName('input')[1], {
      target: { value: 0 },
    });
    expect(screen.queryByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('should disable save button if priority fee entered is greater than base fee', () => {
    render();
    fireEvent.change(document.getElementsByTagName('input')[1], {
      target: { value: 100000 },
    });
    expect(screen.queryByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('should disable save button if gas limit beyond range is entered', () => {
    render();
    fireEvent.click(screen.queryByText('Edit'));
    fireEvent.change(document.getElementsByTagName('input')[3], {
      target: { value: 0 },
    });
    expect(screen.queryByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(document.getElementsByTagName('input')[3], {
      target: { value: 30000 },
    });
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeDisabled();
    fireEvent.change(document.getElementsByTagName('input')[3], {
      target: { value: MAX_GAS_LIMIT_DEC + 1 },
    });
    expect(screen.queryByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
