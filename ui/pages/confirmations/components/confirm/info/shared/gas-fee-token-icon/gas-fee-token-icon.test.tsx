import React from 'react';
import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { NATIVE_TOKEN_ADDRESS } from '../../hooks/useGasFeeToken';
import { GasFeeTokenIcon } from './gas-fee-token-icon';

jest.mock(
  '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts',
);

const FROM_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567891',
  symbol: 'TEST',
  tokenAddress: '0x1234567890123456789012345678901234567890',
};

const store = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      address: FROM_MOCK,
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
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

describe('GasFeeTokenIcon', () => {
  it('renders token icon', () => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <GasFeeTokenIcon tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />,
      store,
    );

    expect(getByTestId('token-icon')).toBeInTheDocument();
  });

  it('renders native icon', () => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <GasFeeTokenIcon tokenAddress={NATIVE_TOKEN_ADDRESS} />,
      store,
    );

    expect(getByTestId('native-icon')).toBeInTheDocument();
  });
});
