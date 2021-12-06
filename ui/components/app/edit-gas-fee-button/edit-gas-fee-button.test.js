import React from 'react';
import { screen } from '@testing-library/react';

import {
  GAS_ESTIMATE_TYPES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import { TRANSACTION_ENVELOPE_TYPES } from '../../../../shared/constants/transaction';

import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { renderWithProvider } from '../../../../test/jest';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

import EditGasFeeButton from './edit-gas-fee-button';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

const render = ({ componentProps, contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      gasFeeEstimates: mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET],
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider {...contextProps}>
      <EditGasFeeButton {...componentProps} />
    </GasFeeContextProvider>,
    store,
  );
};

describe('EditGasFeeButton', () => {
  beforeEach(() => {
    process.env.EIP_1559_V2 = true;
  });

  afterEach(() => {
    process.env.EIP_1559_V2 = false;
  });

  it('should render edit link with text low if low gas estimates are selected', () => {
    render({ contextProps: { transaction: { userFeeLevel: 'low' } } });
    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
  });

  it('should render edit link with text market if medium gas estimates are selected', () => {
    render({ contextProps: { transaction: { userFeeLevel: 'medium' } } });
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
  });

  it('should render edit link with text agressive if high gas estimates are selected', () => {
    render({ contextProps: { transaction: { userFeeLevel: 'high' } } });
    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).toBeInTheDocument();
  });

  it('should render edit link with text Site suggested if site suggested estimated are used', () => {
    render({
      contextProps: {
        transaction: {
          userFeeLevel: PRIORITY_LEVELS.DAPP_SUGGESTED,
          dappSuggestedGasFees: { maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
          txParams: { maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
        },
      },
    });
    expect(screen.queryByText('🌐')).toBeInTheDocument();
    expect(screen.queryByText('Site suggested')).toBeInTheDocument();
    expect(document.getElementsByClassName('info-tooltip')).toHaveLength(1);
  });

  it('should render edit link with text advance if custom gas estimates are used', () => {
    render({
      contextProps: {
        defaultEstimateToUse: 'custom',
      },
    });
    expect(screen.queryByText('⚙')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).toBeInTheDocument();
  });

  it('should not render edit link if transaction has simulation error and prop userAcknowledgedGasMissing is false', () => {
    render({
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

  it('should render edit link if userAcknowledgedGasMissing is true even if transaction has simulation error', () => {
    render({
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

  it('should render null for legacy transactions', () => {
    const { container } = render({
      contextProps: {
        transaction: {
          userFeeLevel: 'low',
          txParams: { type: TRANSACTION_ENVELOPE_TYPES.LEGACY },
        },
      },
    });
    expect(container.firstChild).toBeNull();
  });
});
