import React from 'react';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { CHAIN_IDS } from '../../../../../../../../shared/constants/network';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { getAssetImageUrl } from '../../../../../../../../shared/lib/asset-utils';
import { GasFeeTokenIcon } from './gas-fee-token-icon';

jest.mock(
  '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts',
);

jest.mock('../../../../../../../../shared/lib/asset-utils', () => ({
  getAssetImageUrl: jest.fn().mockReturnValue('https://example.com/token.png'),
}));

const mockGetAssetImageUrl = jest.mocked(getAssetImageUrl);

const FROM_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

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
  beforeEach(() => {
    mockGetAssetImageUrl.mockReturnValue('https://example.com/token.png');
  });

  it('renders token icon with image when getAssetImageUrl returns a URL', () => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <GasFeeTokenIcon tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />,
      store,
    );

    expect(mockGetAssetImageUrl).toHaveBeenCalledWith(
      GAS_FEE_TOKEN_MOCK.tokenAddress,
      CHAIN_IDS.GOERLI,
    );
    expect(getByTestId('token-icon')).toBeInTheDocument();
  });

  it('renders token icon fallback avatar when getAssetImageUrl returns undefined', () => {
    mockGetAssetImageUrl.mockReturnValue(undefined);

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
