import React from 'react';
import { toHex } from '@metamask/controller-utils';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { GasFeeTokenListItem } from './gas-fee-token-list-item';

const FROM_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const store = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      address: FROM_MOCK,
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

describe('GasFeeTokenListItem', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders fiat amount', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenListItem tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />,
      store,
    );

    expect(result.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('renders fiat balance', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenListItem tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />,
      store,
    );

    expect(result.getByText('Bal: $2,345.00 USD')).toBeInTheDocument();
  });

  it('shows token balance when currency rate check is disabled', () => {
    const storeWithoutCurrencyRateCheck = configureStore(
      getMockConfirmStateForTransaction(
        genUnapprovedContractInteractionConfirmation({
          address: FROM_MOCK,
          gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
          selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
        }),
        {
          metamask: {
            preferences: {
              showFiatInTestnets: true,
            },
            useCurrencyRateCheck: false,
          },
        },
      ),
    );

    const result = renderWithConfirmContextProvider(
      <GasFeeTokenListItem tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />,
      storeWithoutCurrencyRateCheck,
    );

    // Should show balance with token amount instead of fiat
    expect(result.getByText(/Bal:/u)).toBeInTheDocument();
    // Should show token balance with symbol (e.g., "Bal: 2.345 TEST")
    expect(result.getByText(/Bal: .*TEST/u)).toBeInTheDocument();
    // Should not show "undefined" text anywhere
    expect(result.queryByText(/undefined/iu)).not.toBeInTheDocument();
  });

  it('renders token amount', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenListItem tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />,
      store,
    );

    expect(result.getByText('1 TEST')).toBeInTheDocument();
  });

  it('renders compact token amount and balance', () => {
    const gasFeeToken = {
      ...GAS_FEE_TOKEN_MOCK,
      amount: toHex(1234567),
      balance: toHex(1034123456),
      decimals: 6,
    };

    const compactStore = configureStore(
      getMockConfirmStateForTransaction(
        genUnapprovedContractInteractionConfirmation({
          address: FROM_MOCK,
          gasFeeTokens: [gasFeeToken],
          selectedGasFeeToken: gasFeeToken.tokenAddress,
        }),
        {
          metamask: {
            preferences: {
              showFiatInTestnets: true,
            },
            useCurrencyRateCheck: false,
          },
        },
      ),
    );

    const result = renderWithConfirmContextProvider(
      <GasFeeTokenListItem tokenAddress={gasFeeToken.tokenAddress} />,
      compactStore,
    );

    expect(result.getByText('1.235 TEST')).toBeInTheDocument();
    expect(result.getByText('Bal: 1,034 TEST')).toBeInTheDocument();
  });

  it('renders warning indicator if warning', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenListItem tokenAddress={undefined} warning="Test Warning" />,
      store,
    );

    expect(result.getByText('Test Warning')).toBeInTheDocument();
  });

  describe('with no token address', () => {
    it('renders fiat amount', () => {
      const result = renderWithConfirmContextProvider(
        <GasFeeTokenListItem tokenAddress={undefined} />,
        store,
      );

      expect(result.getByText('$0.07')).toBeInTheDocument();
    });

    it('renders fiat balance', () => {
      const result = renderWithConfirmContextProvider(
        <GasFeeTokenListItem tokenAddress={undefined} />,
        store,
      );

      expect(result.getByText('Bal: $537,761.36 USD')).toBeInTheDocument();
    });

    it('renders token amount', () => {
      const result = renderWithConfirmContextProvider(
        <GasFeeTokenListItem tokenAddress={undefined} />,
        store,
      );

      expect(result.getByText('0.000125 ETH')).toBeInTheDocument();
    });
  });
});
