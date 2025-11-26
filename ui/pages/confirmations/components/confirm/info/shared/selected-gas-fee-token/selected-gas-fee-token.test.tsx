import React from 'react';
import { GasFeeToken } from '@metamask/transaction-controller';
import { act } from 'react-dom/test-utils';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';

import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import * as DappSwapContext from '../../../../../context/dapp-swap';
import { useHasInsufficientBalance } from '../../../../../hooks/useHasInsufficientBalance';
import { SelectedGasFeeToken } from './selected-gas-fee-token';

jest.mock('../../../../../../../../shared/modules/selectors');
jest.mock('../../../../../hooks/gas/useIsGaslessSupported');
jest.mock('../../../../../hooks/useHasInsufficientBalance');

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
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);
  const useHasInsufficientBalanceMock = jest.mocked(useHasInsufficientBalance);

  beforeEach(() => {
    jest.resetAllMocks();

    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
      pending: false,
    });

    useHasInsufficientBalanceMock.mockReturnValue({
      hasInsufficientBalance: true,
      nativeCurrency: 'ETH',
    });
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

  it('does not render arrow icon if gasless not supported', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });

    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore(),
    );

    expect(result.queryByTestId('selected-gas-fee-token-arrow')).toBeNull();
  });

  it('does not render arrow icon if not smart transaction and future native only', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: true,
      pending: false,
    });

    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore({
        gasFeeTokens: [
          { ...GAS_FEE_TOKEN_MOCK, tokenAddress: NATIVE_TOKEN_ADDRESS },
        ],
      }),
    );

    expect(result.queryByTestId('selected-gas-fee-token-arrow')).toBeNull();
  });

  it('does not render arrow icon if sufficient balance and future native only', () => {
    useHasInsufficientBalanceMock.mockReturnValue({
      hasInsufficientBalance: false,
      nativeCurrency: 'ETH',
    });

    const result = renderWithConfirmContextProvider(
      <SelectedGasFeeToken />,
      getStore({
        gasFeeTokens: [
          { ...GAS_FEE_TOKEN_MOCK, tokenAddress: NATIVE_TOKEN_ADDRESS },
        ],
      }),
    );

    expect(result.queryByTestId('selected-gas-fee-token-arrow')).toBeNull();
  });

  it('does not render arrow icon if quoted swap displayed in info', () => {
    jest.spyOn(DappSwapContext, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: undefined,
      setSelectedQuote: jest.fn(),
      setQuotedSwapDisplayedInInfo: jest.fn(),
    } as unknown as ReturnType<typeof DappSwapContext.useDappSwapContext>);

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
