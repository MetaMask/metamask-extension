import React from 'react';

import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { GasFeeTokenModal } from './gas-fee-token-modal';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';

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
  recipient: '0x7',
  symbol: 'WETH',
  tokenAddress: '0xdef',
};

const store = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK, GAS_FEE_TOKEN_2_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    }),
    {
      metamask: {
        preferences: {
          showFiatInTestnets: true,
        },
      },
    },
  ),
);

describe('GasFeeTokenModal', () => {
  it('renders multiple list items', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      store,
    );

    expect(result.getByText(GAS_FEE_TOKEN_MOCK.symbol)).toBeInTheDocument();
    expect(result.getByText(GAS_FEE_TOKEN_2_MOCK.symbol)).toBeInTheDocument();
  });

  it('selects token matching selectedGasFeeToken', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenModal />,
      store,
    );

    expect(result.queryAllByTestId('gas-fee-token-list-item')[0]).toHaveClass(
      'gas-fee-token-list-item--selected',
    );
  });
});
