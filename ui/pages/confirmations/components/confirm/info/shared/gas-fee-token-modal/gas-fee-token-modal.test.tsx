import React from 'react';
import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { act } from 'react-dom/test-utils';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { updateSelectedGasFeeToken } from '../../../../../../../store/controller-actions/transaction-controller';
import { GAS_FEE_TOKEN_MOCK as GAS_FEE_TOKEN_MOCK_BASE } from '../../../../../../../../test/data/confirmations/gas';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useIsInsufficientBalance } from '../../../../../hooks/useIsInsufficientBalance';
import { GasFeeTokenModal } from './gas-fee-token-modal';

jest.mock('../../../../../hooks/gas/useIsGaslessSupported');
jest.mock('../../../../../hooks/useIsInsufficientBalance');
jest.mock(
  '../../../../../../../store/controller-actions/transaction-controller',
);

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  ...GAS_FEE_TOKEN_MOCK_BASE,
  symbol: 'USDC',
};

const GAS_FEE_TOKEN_2_MOCK: GasFeeToken = {
  amount: toHex(20000),
  balance: toHex(43210),
  decimals: 4,
  gas: '0x3',
  gasTransfer: '0x3a',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567893',
  symbol: 'WETH',
  tokenAddress: '0x1234567890123456789012345678901234567894',
};

const FUTURE_NATIVE_GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  ...GAS_FEE_TOKEN_MOCK,
  symbol: 'ETH',
  tokenAddress: NATIVE_TOKEN_ADDRESS,
};

function getStore({
  gasFeeTokens,
  noSelectedGasFeeToken,
  selectedGasFeeToken,
}: {
  gasFeeTokens?: GasFeeToken[];
  noSelectedGasFeeToken?: boolean;
  selectedGasFeeToken?: `0x${string}`;
} = {}) {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens: gasFeeTokens ?? [
          GAS_FEE_TOKEN_MOCK,
          GAS_FEE_TOKEN_2_MOCK,
        ],
        selectedGasFeeToken: noSelectedGasFeeToken
          ? undefined
          : (selectedGasFeeToken ?? GAS_FEE_TOKEN_MOCK.tokenAddress),
      }),
      {
        metamask: {
          preferences: {
            showFiatInTestnets: true,
          },
          internalAccounts: {
            accounts: {
              'mock-account-id': {
                address: '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b',
                id: 'mock-account-id',
                metadata: {
                  importTime: 0,
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: [],
                type: 'eip155:eoa',
              },
            },
            selectedAccount: 'mock-account-id',
          },
          accountsByChainId: {
            '0x5': {
              '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b': {
                balance: '0xde0b6b3a7640000',
              },
            },
          },
        },
      },
    ),
  );
}

describe('GasFeeTokenModal', () => {
  const updateSelectedGasFeeTokenMock = jest.mocked(updateSelectedGasFeeToken);
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);
  const useIsInsufficientBalanceMock = jest.mocked(useIsInsufficientBalance);

  beforeEach(() => {
    jest.resetAllMocks();
    updateSelectedGasFeeTokenMock.mockResolvedValue(undefined);

    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
      pending: false,
    });

    useIsInsufficientBalanceMock.mockReturnValue(true);
  });

  it('renders gas fee token list items', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore(),
    );

    expect(result.getByText(GAS_FEE_TOKEN_MOCK.symbol)).toBeInTheDocument();
    expect(result.getByText(GAS_FEE_TOKEN_2_MOCK.symbol)).toBeInTheDocument();
  });

  it('renders native list item', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore(),
    );

    expect(result.getByText('0.000066 ETH')).toBeInTheDocument();
  });

  it('selects token matching selectedGasFeeToken', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore(),
    );

    expect(result.getByTestId('gas-fee-token-list-item-USDC')).toHaveClass(
      'gas-fee-token-list-item--selected',
    );
  });

  it('selects native token if no selectedGasFeeToken', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore({ noSelectedGasFeeToken: true }),
    );

    expect(result.getByTestId('gas-fee-token-list-item-ETH')).toHaveClass(
      'gas-fee-token-list-item--selected',
    );
  });

  it('updates selected gas fee token on token click', async () => {
    const onCloseMock = jest.fn();
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal onClose={onCloseMock} />,
      getStore(),
    );

    await act(async () => {
      result.getByTestId('gas-fee-token-list-item-WETH').click();
    });

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_2_MOCK.tokenAddress,
    );
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('shows native toggle if there is a future native token and insufficient balance', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore({
        gasFeeTokens: [FUTURE_NATIVE_GAS_FEE_TOKEN_MOCK],
      }),
    );

    expect(result.getByTestId('native-toggle')).toBeInTheDocument();
  });

  it('hides native toggle if not smart transaction', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: true,
      pending: false,
    });

    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore({
        gasFeeTokens: [FUTURE_NATIVE_GAS_FEE_TOKEN_MOCK],
      }),
    );

    expect(result.queryByTestId('native-toggle')).toBeNull();
  });

  it('hides native toggle if sufficient native balance', () => {
    useIsInsufficientBalanceMock.mockReturnValue(false);

    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore({
        gasFeeTokens: [FUTURE_NATIVE_GAS_FEE_TOKEN_MOCK],
      }),
    );

    expect(result.queryByTestId('native-toggle')).toBeNull();
  });

  it('selects wallet-paid native token when future native toggle is off', async () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore({
        gasFeeTokens: [FUTURE_NATIVE_GAS_FEE_TOKEN_MOCK],
        noSelectedGasFeeToken: true,
      }),
    );

    await act(async () => {
      result.getByTestId('gas-fee-token-list-item-ETH').click();
    });

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      undefined,
    );
  });

  it('selects future-native token when future native toggle is on', async () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      getStore({
        gasFeeTokens: [FUTURE_NATIVE_GAS_FEE_TOKEN_MOCK],
        selectedGasFeeToken: NATIVE_TOKEN_ADDRESS,
      }),
    );

    await act(async () => {
      result.getByTestId('gas-fee-token-list-item-ETH').click();
    });

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      NATIVE_TOKEN_ADDRESS,
    );
  });
});
