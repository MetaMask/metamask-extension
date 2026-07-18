import React from 'react';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import { toast } from '../../../../../../../components/ui/toast/toast';
import { GasFeeTokenToast } from './gas-fee-token-toast';

jest.mock('../../../../../../../../shared/lib/selectors');

jest.mock('../../../../../../../components/ui/toast/toast', () => {
  const actual = jest.requireActual<
    typeof import('../../../../../../../components/ui/toast/toast')
  >('../../../../../../../components/ui/toast/toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: jest.fn(),
      dismiss: jest.fn(),
    },
    ToastContent: actual.ToastContent,
  };
});

jest.mock(
  '../../../../../hooks/transactions/useTransactionMetadataRequest',
  () => ({
    useTransactionMetadataRequestOptional: jest.fn(() => ({
      chainId: '0x5',
    })),
  }),
);

function getStore() {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
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
}

describe('GasFeeTokenToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows toast with token symbol and dismisses on unmount', () => {
    const { unmount } = renderWithConfirmContextProvider(
      <GasFeeTokenToast />,
      getStore(),
    );

    expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: messages.confirmGasFeeTokenToast.message.replace(
            '$1',
            GAS_FEE_TOKEN_MOCK.symbol,
          ),
          dataTestId: 'gas-fee-token-toast',
        }),
      }),
      expect.objectContaining({
        id: 'gas-fee-token-toast',
        duration: 5000,
        style: { visibility: 'visible' },
        icon: expect.anything(),
      }),
    );

    unmount();

    expect(jest.mocked(toast.dismiss)).toHaveBeenCalledWith(
      'gas-fee-token-toast',
    );
  });
});
