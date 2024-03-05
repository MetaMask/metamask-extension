import React from 'react';
import { act, screen } from '@testing-library/react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';

import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { EditGasModes } from '../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';

import {
  NETWORK_TYPES,
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
} from '../../../../../shared/constants/network';
import EditGasFeePopover from './edit-gas-fee-popover';

jest.mock('../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest.fn().mockImplementation(() =>
    Promise.resolve({
      chainId: '0x5',
    }),
  ),
  createTransactionEventFragment: jest.fn(),
}));

jest.mock('../../../../contexts/transaction-modal', () => ({
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

const render = async ({ txProps, contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      currencyRates: {},
      providerConfig: {
        chainId: CHAIN_IDS.GOERLI,
        nickname: GOERLI_DISPLAY_NAME,
        type: NETWORK_TYPES.GOERLI,
      },
      selectedNetworkClientId: 'goerli',
      networksMetadata: {
        goerli: {
          EIPS: {
            1559: true,
          },
          status: 'available',
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.GOERLI]: {
          '0xAddress': { address: '0xAddress', balance: '0x1F4' },
        },
      },
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x1F4',
        },
      },
      identities: {
        '0xAddress': {},
      },
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0xAddress',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
      selectedAddress: '0xAddress',
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
      gasFeeEstimatesByChainId: {
        [CHAIN_IDS.GOERLI]: {
          gasFeeEstimates: MOCK_FEE_ESTIMATE,
        },
      },
      advancedGasFee: {},
    },
  });

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <GasFeeContextProvider
          transaction={{ txParams: { gas: '0x5208' }, ...txProps }}
          {...contextProps}
        >
          <EditGasFeePopover />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('EditGasFeePopover', () => {
  it('should renders low / medium / high options', async () => {
    await render({
      txProps: { dappSuggestedGasFees: { maxFeePerGas: '0x5208' } },
    });

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

  it('should show time estimates', async () => {
    await render();
    expect(screen.queryAllByText('5 min')).toHaveLength(2);
    expect(screen.queryByText('15 sec')).toBeInTheDocument();
  });

  it('should show gas fee estimates', async () => {
    await render();
    expect(screen.queryByTitle('0.001113 ETH')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00147 ETH')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should not show insufficient balance message if transaction value is less than balance', async () => {
    await render({
      txProps: {
        status: TransactionStatus.unapproved,
        type: TransactionType.simpleSend,
        userFeeLevel: 'high',
        txParams: { value: '0x64', from: '0xAddress' },
      },
    });
    expect(screen.queryByText('Insufficient funds.')).not.toBeInTheDocument();
  });

  it('should show insufficient balance message if transaction value is more than balance', async () => {
    await render({
      txProps: {
        status: TransactionStatus.unapproved,
        type: TransactionType.simpleSend,
        userFeeLevel: 'high',
        txParams: { value: '0x5208', from: '0xAddress' },
      },
    });
    expect(screen.queryByText('Insufficient funds.')).toBeInTheDocument();
  });

  it('should not show low, aggressive and dapp-suggested options for swap', async () => {
    await render({
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

  it('should not show time estimates for swaps', async () => {
    await render({
      contextProps: { editGasMode: EditGasModes.swaps },
    });
    expect(screen.queryByText('Time')).not.toBeInTheDocument();
    expect(screen.queryByText('Max fee')).toBeInTheDocument();
  });

  it('should show correct header for edit gas mode', async () => {
    await render({
      contextProps: { editGasMode: EditGasModes.swaps },
    });
    expect(screen.queryByText('Edit gas fee')).toBeInTheDocument();
    await render({
      contextProps: { editGasMode: EditGasModes.cancel },
    });
    expect(screen.queryByText('Edit cancellation gas fee')).toBeInTheDocument();
    await render({
      contextProps: { editGasMode: EditGasModes.speedUp },
    });
    expect(screen.queryByText('Edit speed up gas fee')).toBeInTheDocument();
  });

  it('should not show low option for cancel mode', async () => {
    await render({
      contextProps: { editGasMode: EditGasModes.cancel },
    });
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
  });

  it('should not show low option for speedup mode', async () => {
    await render({
      contextProps: { editGasMode: EditGasModes.speedUp },
    });
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
  });

  it('should show tenPercentIncreased option for cancel gas mode', async () => {
    await render({
      contextProps: { editGasMode: EditGasModes.cancel },
    });
    expect(screen.queryByText('10% increase')).toBeInTheDocument();
  });

  it('should show tenPercentIncreased option for speedup gas mode', async () => {
    await render({
      contextProps: { editGasMode: EditGasModes.speedUp },
    });
    expect(screen.queryByText('10% increase')).toBeInTheDocument();
  });
});
