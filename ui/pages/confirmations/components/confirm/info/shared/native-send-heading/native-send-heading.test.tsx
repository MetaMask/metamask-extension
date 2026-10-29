import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import NativeSendHeading from './native-send-heading';

function getMockStore(conversionRate: number) {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      chainId: CHAIN_IDS.GOERLI,
    }),
    {
      metamask: {
        preferences: {
          showFiatInTestnets: true,
        },
        currencyRates: {
          ETH: {
            conversionRate,
          },
        },
      },
    },
  );

  const middleware = [thunk];
  return configureMockStore(middleware)(state);
}

describe('<NativeSendHeading />', () => {
  it('does not throw when the conversion rate has more than 15 significant digits', () => {
    const mockStore = getMockStore(0.07086574003221964);

    expect(() =>
      renderWithConfirmContextProvider(<NativeSendHeading />, mockStore),
    ).not.toThrow();
  });
});
