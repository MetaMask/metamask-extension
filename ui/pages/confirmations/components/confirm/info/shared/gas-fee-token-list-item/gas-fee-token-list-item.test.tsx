import React from 'react';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { useInsufficientBalanceAlerts } from '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts';
import { Severity } from '../../../../../../../helpers/constants/design-system';
import { NATIVE_TOKEN_ADDRESS } from '../../hooks/useGasFeeToken';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { GasFeeTokenListItem } from './gas-fee-token-list-item';

jest.mock(
  '../../../../../hooks/alerts/transactions/useInsufficientBalanceAlerts',
);

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
  const useInsufficientBalanceAlertsMock = jest.mocked(
    useInsufficientBalanceAlerts,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    useInsufficientBalanceAlertsMock.mockReturnValue([]);
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

  it('renders token amount', () => {
    const result = renderWithConfirmContextProvider(
      <GasFeeTokenListItem tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />,
      store,
    );

    expect(result.getByText('1 TEST')).toBeInTheDocument();
  });

  describe('with native token address', () => {
    it('renders fiat amount', () => {
      const result = renderWithConfirmContextProvider(
        <GasFeeTokenListItem tokenAddress={NATIVE_TOKEN_ADDRESS} />,
        store,
      );

      expect(result.getByText('$0.04')).toBeInTheDocument();
    });

    it('renders fiat balance', () => {
      const result = renderWithConfirmContextProvider(
        <GasFeeTokenListItem tokenAddress={NATIVE_TOKEN_ADDRESS} />,
        store,
      );

      expect(result.getByText('Bal: $537,761.36 USD')).toBeInTheDocument();
    });

    it('renders token amount', () => {
      const result = renderWithConfirmContextProvider(
        <GasFeeTokenListItem tokenAddress={NATIVE_TOKEN_ADDRESS} />,
        store,
      );

      expect(result.getByText('0.000066 ETH')).toBeInTheDocument();
    });

    it('renders insufficient balance indicator', () => {
      useInsufficientBalanceAlertsMock.mockReturnValue([
        {
          content: 'Insufficient balance',
          key: 'insufficientBalance',
          severity: Severity.Danger,
        },
      ]);

      const result = renderWithConfirmContextProvider(
        <GasFeeTokenListItem tokenAddress={NATIVE_TOKEN_ADDRESS} />,
        store,
      );

      expect(result.getByText('Insufficient funds')).toBeInTheDocument();
    });
  });
});
