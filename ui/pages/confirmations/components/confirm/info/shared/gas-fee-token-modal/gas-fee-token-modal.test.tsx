import React from 'react';

import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { act } from '@testing-library/react';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import {
  updateBatchTransactions,
  updateSelectedGasFeeToken,
} from '../../../../../../../store/controller-actions/transaction-controller';
import { GAS_FEE_TOKEN_MOCK as GAS_FEE_TOKEN_MOCK_BASE } from '../../../../../../../../test/data/confirmations/gas';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useInsufficientBalanceAlerts } from '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts';
import { Severity } from '../../../../../../../helpers/constants/design-system';
import { GasFeeTokenModal } from './gas-fee-token-modal';

jest.mock('../../../../../hooks/gas/useIsGaslessSupported');
jest.mock(
  '../../../../../../../store/controller-actions/transaction-controller',
);
jest.mock(
  '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts',
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

function getState({
  gasFeeTokens,
  noSelectedGasFeeToken,
}: { gasFeeTokens?: GasFeeToken[]; noSelectedGasFeeToken?: boolean } = {}) {
  return getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: gasFeeTokens ?? [GAS_FEE_TOKEN_MOCK, GAS_FEE_TOKEN_2_MOCK],
      selectedGasFeeToken: noSelectedGasFeeToken
        ? undefined
        : GAS_FEE_TOKEN_MOCK.tokenAddress,
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
  );
}

const store = configureStore(getState());

describe('GasFeeTokenModal', () => {
  const updateSelectedGasFeeTokenMock = jest.mocked(updateSelectedGasFeeToken);
  const updateBatchTransactionsMock = jest.mocked(updateBatchTransactions);
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);
  const useInsufficientBalanceAlertsMock = jest.mocked(
    useInsufficientBalanceAlerts,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    updateSelectedGasFeeTokenMock.mockResolvedValue(undefined);
    updateBatchTransactionsMock.mockResolvedValue(undefined);

    useInsufficientBalanceAlertsMock.mockReturnValue([
      {
        content: 'Insufficient balance',
        key: 'insufficientBalance',
        severity: Severity.Danger,
      },
    ]);

    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
    });
  });

  it('renders multiple list items', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      store,
    );

    expect(result.getByText(GAS_FEE_TOKEN_MOCK.symbol)).toBeInTheDocument();
    expect(result.getByText(GAS_FEE_TOKEN_2_MOCK.symbol)).toBeInTheDocument();
  });

  it('renders native list item', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      store,
    );

    expect(result.getByText('0.000066 ETH')).toBeInTheDocument();
  });

  it('selects token matching selectedGasFeeToken', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      store,
    );

    expect(result.getByTestId('gas-fee-token-list-item-USDC')).toHaveClass(
      'gas-fee-token-list-item--selected',
    );
  });

  it('selects native token if no selectedGasFeeToken', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(getState({ noSelectedGasFeeToken: true })),
    );

    expect(result.getByTestId('gas-fee-token-list-item-ETH')).toHaveClass(
      'gas-fee-token-list-item--selected',
    );
  });

  it('updates selected gas fee token on click', async () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(getState()),
    );

    await act(async () => {
      result.getByTestId('gas-fee-token-list-item-WETH').click();
    });

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_2_MOCK.tokenAddress,
    );
  });

  it('displays native toggle if future native token and insufficient balance', async () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(
        getState({
          gasFeeTokens: [
            {
              ...GAS_FEE_TOKEN_MOCK,
              tokenAddress: NATIVE_TOKEN_ADDRESS,
            },
          ],
        }),
      ),
    );

    expect(result.getByTestId('native-toggle')).toBeInTheDocument();
  });

  it('hides native toggle if no future native token', async () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(getState()),
    );

    expect(result.queryByTestId('native-toggle')).toBeNull();
  });

  it('hides native toggle if not smart transaction', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: true,
    });

    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(
        getState({
          gasFeeTokens: [
            {
              ...GAS_FEE_TOKEN_MOCK,
              tokenAddress: NATIVE_TOKEN_ADDRESS,
            },
          ],
        }),
      ),
    );

    expect(result.queryByTestId('native-toggle')).toBeNull();
  });

  it('hides native toggle if sufficient balance', async () => {
    useInsufficientBalanceAlertsMock.mockReturnValue([]);

    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(
        getState({
          gasFeeTokens: [
            {
              ...GAS_FEE_TOKEN_MOCK,
              tokenAddress: NATIVE_TOKEN_ADDRESS,
            },
          ],
        }),
      ),
    );

    expect(result.queryByTestId('native-toggle')).toBeNull();
  });
});
