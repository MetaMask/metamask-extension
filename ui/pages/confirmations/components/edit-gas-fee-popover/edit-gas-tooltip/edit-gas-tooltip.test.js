import React from 'react';
import { act } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import { renderWithProvider } from '../../../../../../test/jest';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import EditGasToolTip from './edit-gas-tooltip';

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
}));

const LOW_GAS_OPTION = {
  maxFeePerGas: '2.010203381',
  maxPriorityFeePerGas: '1.20004164',
};

const MEDIUM_GAS_OPTION = {
  maxFeePerGas: '2.383812808',
  maxPriorityFeePerGas: '1.5',
};

const HIGH_GAS_OPTION = {
  maxFeePerGas: '2.920638342',
  maxPriorityFeePerGas: '2',
};

const render = async (componentProps) => {
  const mockStore = {
    metamask: {
      providerConfig: {},
      accountsByChainId: {
        '0x1': {
          '0xAddress': {
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
      selectedAddress: '0xAddress',
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
      },
      featureFlags: { advancedInlineGas: true },
    },
  };

  const store = configureStore(mockStore);

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <GasFeeContextProvider transaction={{ txParams: { gas: '0x5208' } }}>
          <EditGasToolTip {...componentProps} t={jest.fn()} gasLimit={21000} />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('EditGasToolTip', () => {
  it('should render correct values for priorityLevel low', async () => {
    const { queryByText } = await render({
      priorityLevel: 'low',
      ...LOW_GAS_OPTION,
    });

    expect(queryByText('2.0102')).toBeInTheDocument();
    expect(queryByText('1.2')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel medium', async () => {
    const { queryByText } = await render({
      priorityLevel: 'medium',
      ...MEDIUM_GAS_OPTION,
    });
    expect(queryByText('2.3838')).toBeInTheDocument();
    expect(queryByText('1.5')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel high', async () => {
    const { queryByText } = await render({
      priorityLevel: 'high',
      ...HIGH_GAS_OPTION,
    });
    expect(queryByText('2.9206')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });
});
