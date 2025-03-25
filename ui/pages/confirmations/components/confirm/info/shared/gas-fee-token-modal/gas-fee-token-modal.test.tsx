import React from 'react';

import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { act } from '@testing-library/react';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import {
  updateBatchTransactions,
  updateSelectedGasFeeToken,
} from '../../../../../../../store/actions/transaction-controller';
import { GasFeeTokenModal } from './gas-fee-token-modal';

jest.mock('../../../../../../../store/actions/transaction-controller');

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x7',
  symbol: 'USDC',
  tokenAddress: '0xabc',
};

const GAS_FEE_TOKEN_2_MOCK: GasFeeToken = {
  amount: toHex(20000),
  balance: toHex(43210),
  decimals: 4,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x123456789012345678901234567890123456789A',
  symbol: 'WETH',
  tokenAddress: '0x1234567890123456789012345678901234567890',
};

function getState({
  noSelectedGasFeeToken,
}: { noSelectedGasFeeToken?: boolean } = {}) {
  return getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK, GAS_FEE_TOKEN_2_MOCK],
      selectedGasFeeToken: noSelectedGasFeeToken
        ? undefined
        : GAS_FEE_TOKEN_MOCK.tokenAddress,
    }),
    {
      metamask: {
        preferences: {
          showFiatInTestnets: true,
        },
      },
    },
  );
}

const store = configureStore(getState());

describe('GasFeeTokenModal', () => {
  const updateSelectedGasFeeTokenMock = jest.mocked(updateSelectedGasFeeToken);
  const updateBatchTransactionsMock = jest.mocked(updateBatchTransactions);

  beforeEach(() => {
    jest.resetAllMocks();
    updateSelectedGasFeeTokenMock.mockResolvedValue(undefined);
    updateBatchTransactionsMock.mockResolvedValue(undefined);
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

    expect(result.queryAllByTestId('gas-fee-token-list-item')[1]).toHaveClass(
      'gas-fee-token-list-item--selected',
    );
  });

  it('selects native token if no selectedGasFeeToken', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(getState({ noSelectedGasFeeToken: true })),
    );

    expect(result.queryAllByTestId('gas-fee-token-list-item')[0]).toHaveClass(
      'gas-fee-token-list-item--selected',
    );
  });

  it('updates selected gas fee token on click', async () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(getState()),
    );

    await act(async () => {
      result.queryAllByTestId('gas-fee-token-list-item')[2].click();
    });

    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSelectedGasFeeTokenMock).toHaveBeenCalledWith(
      expect.any(String),
      GAS_FEE_TOKEN_2_MOCK.tokenAddress,
    );
  });

  it('adds token transfer batch transaction on click', async () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      configureStore(getState()),
    );

    await act(async () => {
      result.queryAllByTestId('gas-fee-token-list-item')[2].click();
    });

    expect(updateBatchTransactionsMock).toHaveBeenCalledTimes(1);
    expect(updateBatchTransactionsMock).toHaveBeenCalledWith({
      transactionId: expect.any(String),
      batchTransactions: [
        {
          data: '0xa9059cbb000000000000000000000000123456789012345678901234567890123456789a0000000000000000000000000000000000000000000000000000000000004e20',
          maxFeePerGas: GAS_FEE_TOKEN_2_MOCK.maxFeePerGas,
          maxPriorityFeePerGas: GAS_FEE_TOKEN_2_MOCK.maxPriorityFeePerGas,
          to: GAS_FEE_TOKEN_2_MOCK.tokenAddress,
        },
      ],
    });
  });
});
