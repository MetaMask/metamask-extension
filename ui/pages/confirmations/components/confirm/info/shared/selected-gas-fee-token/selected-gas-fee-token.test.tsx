import React from 'react';
import { GasFeeToken } from '@metamask/transaction-controller';
import { act } from 'react-dom/test-utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getIsSmartTransaction } from '../../../../../../../../shared/modules/selectors';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { SelectedGasFeeToken } from './selected-gas-fee-token';

jest.mock('../../../../../../../../shared/modules/selectors');

function getStore({
  gasFeeTokens,
  noSelectedGasFeeToken,
}: { gasFeeTokens?: GasFeeToken[]; noSelectedGasFeeToken?: boolean } = {}) {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens: gasFeeTokens ?? [GAS_FEE_TOKEN_MOCK],
        selectedGasFeeToken: noSelectedGasFeeToken
          ? undefined
          : GAS_FEE_TOKEN_MOCK.tokenAddress,
      }),
      {
        metamask: {
          preferences: {
            showFiatInTestnets: true,
            smartTransactionsOptInStatus: true,
          },
        },
      },
    ),
  );
}

describe('SelectedGasFeeToken', () => {
  const getIsSmartTransactionMock = jest.mocked(getIsSmartTransaction);

  beforeEach(() => {
    jest.resetAllMocks();
    getIsSmartTransactionMock.mockReturnValue(true);
  });

  it('renders native symbol', () => {
    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore({ noSelectedGasFeeToken: true }),
    );

    expect(result.getByText('ETH')).toBeInTheDocument();
  });

  it('renders token symbol', () => {
    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore(),
    );

    expect(result.getByText(GAS_FEE_TOKEN_MOCK.symbol)).toBeInTheDocument();
  });

  it('renders arrow icon if gas fee tokens', () => {
    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore(),
    );

    expect(
      result.getByTestId('selected-gas-fee-token-arrow'),
    ).toBeInTheDocument();
  });

  it('does not render arrow icon if no gas fee tokens', () => {
    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore({ gasFeeTokens: [] }),
    );

    expect(result.queryByTestId('selected-gas-fee-token-arrow')).toBeNull();
  });

  it('does not render arrow icon if smart transactions disabled', () => {
    getIsSmartTransactionMock.mockReturnValue(false);

    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore(),
    );

    expect(result.queryByTestId('selected-gas-fee-token-arrow')).toBeNull();
  });

  it('displays modal on click', async () => {
    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore(),
    );

    await act(async () => {
      result.getByText(GAS_FEE_TOKEN_MOCK.symbol).click();
    });

    expect(result.getByText('Select a token')).toBeInTheDocument();
  });
});
