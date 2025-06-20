import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';

import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import { MAX_GAS_LIMIT_DEC } from '../../send/send.constants';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';

import { getSelectedInternalAccountFromMockState } from '../../../../../test/jest/mocks';
import AdvancedGasFeePopover from './advanced-gas-fee-popover';

jest.mock('../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  createTransactionEventFragment: jest.fn(),
}));

jest.mock('../../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: () => ({
    closeModal: () => undefined,
    currentModal: 'advancedGasFee',
  }),
}));

const mockSelectedInternalAccount =
  getSelectedInternalAccountFromMockState(mockState);

const render = async () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockSelectedInternalAccount.address]: {
          address: mockSelectedInternalAccount.address,
          balance: '0x1F4',
        },
      },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
      gasFeeEstimatesByChainId: {
        ...mockState.metamask.gasFeeEstimatesByChainId,
        '0x5': {
          ...mockState.metamask.gasFeeEstimatesByChainId['0x5'],
          gasFeeEstimates:
            mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
        },
      },
    },
  });

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <GasFeeContextProvider
          transaction={{
            userFeeLevel: 'high',
            txParams: { gas: '0x5208' },
          }}
        >
          <AdvancedGasFeePopover />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('AdvancedGasFeePopover', () => {
  it('should renders save button enabled by default', async () => {
    await render();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeDisabled();
  });

  it('should enable save button if priority fee 0 is entered', async () => {
    await render();
    fireEvent.change(document.getElementsByTagName('input')[1], {
      target: { value: 0 },
    });
    expect(screen.queryByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('should disable save button if priority fee entered is greater than base fee', async () => {
    await render();
    fireEvent.change(document.getElementsByTagName('input')[1], {
      target: { value: 100000 },
    });
    expect(screen.queryByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('should disable save button if gas limit beyond range is entered', async () => {
    await render();
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
