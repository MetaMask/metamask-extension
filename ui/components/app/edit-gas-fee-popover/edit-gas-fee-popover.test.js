import React from 'react';
import { screen } from '@testing-library/react';

import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { EditGasModes } from '../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import { GasFeeContextProvider } from '../../../contexts/gasFee';

import {
  NETWORK_TYPES,
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import EditGasFeePopover from './edit-gas-fee-popover';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
}));

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: () => ({
    closeModal: () => undefined,
    currentModal: 'editGasFee',
  }),
}));

const MOCK_FEE_ESTIMATE = {
  low: {
    minWaitTimeEstimate: 360000,
    maxWaitTimeEstimate: 300000,
    suggestedMaxPriorityFeePerGas: 3,
    suggestedMaxFeePerGas: 53,
  },
  medium: {
    minWaitTimeEstimate: 30000,
    maxWaitTimeEstimate: 60000,
    suggestedMaxPriorityFeePerGas: 7,
    suggestedMaxFeePerGas: 70,
  },
  high: {
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 15000,
    suggestedMaxPriorityFeePerGas: 10,
    suggestedMaxFeePerGas: 100,
  },
  latestPriorityFeeRange: [2, 6],
  estimatedBaseFee: 50,
  networkCongestion: 0.7,
};

const render = ({ txProps, contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      currencyRates: {},
      providerConfig: {
        chainId: CHAIN_IDS.GOERLI,
        nickname: GOERLI_DISPLAY_NAME,
        type: NETWORK_TYPES.GOERLI,
      },
      cachedBalances: {},
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x1F4',
        },
      },
      identities: {
        '0xAddress': {},
      },
      selectedAddress: '0xAddress',
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
      advancedGasFee: {},
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{ txParams: { gas: '0x5208' }, ...txProps }}
      {...contextProps}
    >
      <EditGasFeePopover />
    </GasFeeContextProvider>,
    store,
  );
};

describe('EditGasFeePopover', () => {
  it('should renders low / medium / high options', () => {
    render({ txProps: { dappSuggestedGasFees: { maxFeePerGas: '0x5208' } } });

    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('🌐')).toBeInTheDocument();
    expect(screen.queryByText('⚙️')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).toBeInTheDocument();
    expect(screen.queryByText('Site')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
  });

  it('should show time estimates', () => {
    render();
    expect(screen.queryAllByText('5 min')).toHaveLength(2);
    expect(screen.queryByText('15 sec')).toBeInTheDocument();
  });

  it('should show gas fee estimates', () => {
    render();
    expect(screen.queryByTitle('0.001113 ETH')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00147 ETH')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should not show insufficient balance message if transaction value is less than balance', () => {
    render({
      txProps: {
        status: TransactionStatus.unapproved,
        type: TransactionType.simpleSend,
        userFeeLevel: 'high',
        txParams: { value: '0x64', from: '0xAddress' },
      },
    });
    expect(screen.queryByText('Insufficient funds.')).not.toBeInTheDocument();
  });

  it('should show insufficient balance message if transaction value is more than balance', () => {
    render({
      txProps: {
        status: TransactionStatus.unapproved,
        type: TransactionType.simpleSend,
        userFeeLevel: 'high',
        txParams: { value: '0x5208', from: '0xAddress' },
      },
    });
    expect(screen.queryByText('Insufficient funds.')).toBeInTheDocument();
  });

  it('should not show low, aggressive and dapp-suggested options for swap', () => {
    render({
      contextProps: { editGasMode: EditGasModes.swaps },
    });
    expect(screen.queryByText('🐢')).not.toBeInTheDocument();
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('🦍')).not.toBeInTheDocument();
    expect(screen.queryByText('🌐')).not.toBeInTheDocument();
    expect(screen.queryByText('🔄')).toBeInTheDocument();
    expect(screen.queryByText('⚙️')).toBeInTheDocument();
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).not.toBeInTheDocument();
    expect(screen.queryByText('Site')).not.toBeInTheDocument();
    expect(screen.queryByText('Swap suggested')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
  });

  it('should not show time estimates for swaps', () => {
    render({
      contextProps: { editGasMode: EditGasModes.swaps },
    });
    expect(screen.queryByText('Time')).not.toBeInTheDocument();
    expect(screen.queryByText('Max fee')).toBeInTheDocument();
  });

  it('should show correct header for edit gas mode', () => {
    render({
      contextProps: { editGasMode: EditGasModes.swaps },
    });
    expect(screen.queryByText('Edit gas fee')).toBeInTheDocument();
    render({
      contextProps: { editGasMode: EditGasModes.cancel },
    });
    expect(screen.queryByText('Edit cancellation gas fee')).toBeInTheDocument();
    render({
      contextProps: { editGasMode: EditGasModes.speedUp },
    });
    expect(screen.queryByText('Edit speed up gas fee')).toBeInTheDocument();
  });

  it('should not show low option for cancel mode', () => {
    render({
      contextProps: { editGasMode: EditGasModes.cancel },
    });
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
  });

  it('should not show low option for speedup mode', () => {
    render({
      contextProps: { editGasMode: EditGasModes.speedUp },
    });
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
  });

  it('should show tenPercentIncreased option for cancel gas mode', () => {
    render({
      contextProps: { editGasMode: EditGasModes.cancel },
    });
    expect(screen.queryByText('10% increase')).toBeInTheDocument();
  });

  it('should show tenPercentIncreased option for speedup gas mode', () => {
    render({
      contextProps: { editGasMode: EditGasModes.speedUp },
    });
    expect(screen.queryByText('10% increase')).toBeInTheDocument();
  });
});
