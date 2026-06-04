import React from 'react';
import { toast } from '@metamask/design-system-react';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GasFeeTokenToast } from './gas-fee-token-toast';

jest.mock('../../../../../../../../shared/lib/selectors');

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const mockToast = jest.fn();
  mockToast.dismiss = jest.fn();
  return {
    ...actual,
    toast: mockToast,
  };
});

const mockToast = toast as jest.MockedFunction<typeof toast> & {
  dismiss: jest.Mock;
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches an MMDS toast for the selected gas fee token', async () => {
    renderWithConfirmContextProvider(<GasFeeTokenToast />, getStore());

    await Promise.resolve();

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'default',
        hasNoTimeout: true,
        title: expect.anything(),
        startAccessory: expect.anything(),
      }),
    );
  });
});
