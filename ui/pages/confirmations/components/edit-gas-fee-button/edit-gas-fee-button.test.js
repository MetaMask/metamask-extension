import React from 'react';
import { act, screen } from '@testing-library/react';

import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import {
  EditGasModes,
  GasEstimateTypes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';

import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import { renderWithProvider } from '../../../../../test/jest';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';

import EditGasFeeButton from './edit-gas-fee-button';

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

const render = async ({ componentProps, contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
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
        <GasFeeContextProvider {...contextProps}>
          <EditGasFeeButton {...componentProps} />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('EditGasFeeButton', () => {
  it('should render edit link with text low if low gas estimates are selected', async () => {
    await render({ contextProps: { transaction: { userFeeLevel: 'low' } } });
    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
  });

  it('should render edit link with text market if medium gas estimates are selected', async () => {
    await render({ contextProps: { transaction: { userFeeLevel: 'medium' } } });
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
  });

  it('should render edit link with text aggressive if high gas estimates are selected', async () => {
    await render({ contextProps: { transaction: { userFeeLevel: 'high' } } });
    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).toBeInTheDocument();
  });

  it('should render edit link with text 10% increase if tenPercentIncreased gas estimates are selected', async () => {
    await render({
      contextProps: { transaction: { userFeeLevel: 'tenPercentIncreased' } },
    });
    expect(screen.queryByText('10% increase')).toBeInTheDocument();
  });

  it('should render edit link with text Site suggested if site suggested estimated are used', async () => {
    await render({
      contextProps: {
        transaction: {
          userFeeLevel: PriorityLevels.dAppSuggested,
          dappSuggestedGasFees: { maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
          txParams: { maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
        },
      },
    });
    expect(screen.queryByText('🌐')).toBeInTheDocument();
    expect(screen.queryByText('Site suggested')).toBeInTheDocument();
    expect(document.getElementsByClassName('info-tooltip')).toHaveLength(1);
  });

  it('should render edit link with text swap suggested if high gas estimates are selected for swaps', async () => {
    await render({
      contextProps: {
        transaction: { userFeeLevel: 'high' },
        editGasMode: EditGasModes.swaps,
      },
    });
    expect(screen.queryByText('🔄')).toBeInTheDocument();
    expect(screen.queryByText('Swap suggested')).toBeInTheDocument();
  });

  it('should render edit link with text advance if custom gas estimates are used', async () => {
    await render({
      contextProps: {
        defaultEstimateToUse: 'custom',
        transaction: {},
      },
    });
    expect(screen.queryByText('⚙️')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).toBeInTheDocument();
  });

  it('should not render edit link if transaction has simulation error and prop userAcknowledgedGasMissing is false', async () => {
    await render({
      contextProps: {
        transaction: {
          simulationFails: true,
          userFeeLevel: 'low',
        },
      },
      componentProps: { userAcknowledgedGasMissing: false },
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
  });

  it('should render edit link if userAcknowledgedGasMissing is true even if transaction has simulation error', async () => {
    await render({
      contextProps: {
        transaction: {
          simulationFails: true,
          userFeeLevel: 'low',
        },
      },
      componentProps: { userAcknowledgedGasMissing: true },
    });
    expect(screen.queryByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
  });

  it('should render null for legacy transactions', async () => {
    const { container } = await render({
      contextProps: {
        transaction: {
          userFeeLevel: 'low',
          txParams: { type: TransactionEnvelopeType.legacy },
        },
      },
    });
    expect(container.firstChild).toBeNull();
  });
});
