import React from 'react';
import { toHex } from '@metamask/controller-utils';
import { GasFeeToken } from '@metamask/transaction-controller';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GasFeeTokenToast } from './gas-fee-token-toast';

jest.mock('../../../../../../../../shared/modules/selectors');

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567891',
  symbol: 'USDC',
  tokenAddress: '0x1234567890123456789012345678901234567890',
};

function getStore({
  noSelectedGasFeeToken,
}: { noSelectedGasFeeToken?: boolean } = {}) {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
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
    ),
  );
}

describe('GasFeeTokenToast', () => {
  it('renders token symbol', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenToast />,
      getStore(),
    );

    expect(result.getByText(GAS_FEE_TOKEN_MOCK.symbol)).toBeInTheDocument();
  });
});
