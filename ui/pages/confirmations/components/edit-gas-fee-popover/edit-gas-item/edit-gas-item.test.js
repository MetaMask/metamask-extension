import React from 'react';
import { act, screen } from '@testing-library/react';

import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';

import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../../../shared/constants/network';
import EditGasItem from './edit-gas-item';

jest.mock('../../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  getGasFeeTimeEstimate: jest
    .fn()
    .mockImplementation(() => Promise.resolve('unknown')),
  createTransactionEventFragment: jest.fn(),
}));

const MOCK_FEE_ESTIMATE = {
  low: {
    minWaitTimeEstimate: 360000,
    maxWaitTimeEstimate: 300000,
    suggestedMaxPriorityFeePerGas: '3',
    suggestedMaxFeePerGas: '53',
  },
  medium: {
    minWaitTimeEstimate: 30000,
    maxWaitTimeEstimate: 60000,
    suggestedMaxPriorityFeePerGas: '7',
    suggestedMaxFeePerGas: '70',
  },
  high: {
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 15000,
    suggestedMaxPriorityFeePerGas: '10',
    suggestedMaxFeePerGas: '100',
  },
  estimatedBaseFee: '50',
};

const ESTIMATE_MOCK = {
  maxFeePerGas: '0x59682f10',
  maxPriorityFeePerGas: '0x59682f00',
};

const render = async ({
  componentProps,
  transactionProps,
  contextProps,
} = {}) => {
  const store = configureStore({
    metamask: {
      currencyRates: {},
      providerConfig: {
        chainId: CHAIN_IDS.GOERLI,
        nickname: GOERLI_DISPLAY_NAME,
        type: NETWORK_TYPES.GOERLI,
      },
      selectedNetworkClientId: 'goerli',
      networkConfigurations: {
        goerli: {
          type: 'rpc',
          chainId: '0x5',
          ticker: 'ETH',
          id: 'goerli',
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.GOERLI]: {
          '0xAddress': {
            address: '0xAddress',
            balance: '0x176e5b6f173ebe66',
          },
        },
      },
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x176e5b6f173ebe66',
        },
      },
      identities: {
        '0xAddress': {},
      },
      internalAccounts: {
        accounts: {
          mockId: {
            address: '0xAddress',
            id: 'mockId',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: 'mock-id',
      },
      selectedAddress: '0xAddress',
      featureFlags: { advancedInlineGas: true },
      gasEstimateType: 'fee-market',
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
      gasFeeEstimatesByChainId: {
        [CHAIN_IDS.GOERLI]: {
          gasFeeEstimates: MOCK_FEE_ESTIMATE,
          gasEstimateType: 'fee-market',
        },
      },
      advancedGasFee: {
        [CHAIN_IDS.GOERLI]: {
          maxBaseFee: '100',
          priorityFee: '2',
        },
      },
    },
  });

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <GasFeeContextProvider
          transaction={{ txParams: { gas: '0x5208' }, ...transactionProps }}
          {...contextProps}
        >
          <EditGasItem priorityLevel="low" {...componentProps} />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('EditGasItem', () => {
  it('should renders low gas estimate option for priorityLevel low', async () => {
    await render({ componentProps: { priorityLevel: PriorityLevels.low } });
    expect(screen.queryByRole('button', { name: 'low' })).toBeInTheDocument();
    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('5 min')).toBeInTheDocument();
    expect(screen.queryByTitle('0.001113 ETH')).toBeInTheDocument();
  });

  it('should renders market gas estimate option for priorityLevel medium', async () => {
    await render({
      componentProps: { priorityLevel: PriorityLevels.medium },
    });
    expect(
      screen.queryByRole('button', { name: 'medium' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
    expect(screen.queryByText('5 min')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00147 ETH')).toBeInTheDocument();
  });

  it('should renders aggressive gas estimate option for priorityLevel high', async () => {
    await render({ componentProps: { priorityLevel: PriorityLevels.high } });
    expect(screen.queryByRole('button', { name: 'high' })).toBeInTheDocument();
    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).toBeInTheDocument();
    expect(screen.queryByText('15 sec')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should render priorityLevel high as "Swap suggested" for swaps', async () => {
    await render({
      componentProps: { priorityLevel: PriorityLevels.high },
      contextProps: { editGasMode: EditGasModes.swaps },
    });
    expect(screen.queryByRole('button', { name: 'high' })).toBeInTheDocument();
    expect(screen.queryByText('🔄')).toBeInTheDocument();
    expect(screen.queryByText('Swap suggested')).toBeInTheDocument();
    expect(screen.queryByText('15 sec')).not.toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should highlight option is priorityLevel is currently selected', async () => {
    await render({
      componentProps: { priorityLevel: PriorityLevels.high },
      transactionProps: { userFeeLevel: 'high' },
    });
    expect(
      document.getElementsByClassName('edit-gas-item--selected'),
    ).toHaveLength(1);
  });

  it('should renders site gas estimate option for priorityLevel dappSuggested', async () => {
    await render({
      componentProps: { priorityLevel: PriorityLevels.dAppSuggested },
      transactionProps: { dappSuggestedGasFees: ESTIMATE_MOCK },
    });
    expect(
      screen.queryByRole('button', { name: 'dappSuggested' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('🌐')).toBeInTheDocument();
    expect(screen.queryByText('Site')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0000315 ETH')).toBeInTheDocument();
  });

  it('should not renders site gas estimate option for priorityLevel dappSuggested if site does not provided gas estimates', async () => {
    await render({
      componentProps: { priorityLevel: PriorityLevels.dAppSuggested },
      transactionProps: {},
    });
    expect(
      screen.queryByRole('button', { name: 'dappSuggested' }),
    ).not.toBeInTheDocument();
    await render({
      componentProps: { priorityLevel: PriorityLevels.dAppSuggested },
      transactionProps: { dappSuggestedGasFees: { gas: '0x59682f10' } },
    });
    expect(
      screen.queryByRole('button', { name: 'dappSuggested' }),
    ).not.toBeInTheDocument();
  });

  it('should renders advance gas estimate option for priorityLevel custom', async () => {
    await render({
      componentProps: { priorityLevel: PriorityLevels.custom },
      transactionProps: { userFeeLevel: 'high' },
    });
    expect(
      screen.queryByRole('button', { name: 'custom' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('⚙️')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
    // below value of custom gas fee estimate is default obtained from state.metamask.advancedGasFee
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should renders +10% gas estimate option for priorityLevel minimum', async () => {
    await render({
      componentProps: { priorityLevel: PriorityLevels.tenPercentIncreased },
      transactionProps: {
        userFeeLevel: 'tenPercentIncreased',
        previousGas: ESTIMATE_MOCK,
      },
      contextProps: { editGasMode: EditGasModes.cancel },
    });
    expect(
      screen.queryByRole('button', { name: 'tenPercentIncreased' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('10% increase')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00003465 ETH')).toBeInTheDocument();
  });
});
