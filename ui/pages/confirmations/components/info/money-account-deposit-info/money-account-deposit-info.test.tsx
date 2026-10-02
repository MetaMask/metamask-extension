import React from 'react';
import { useSelector } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { useUpgradeMoneyAccount } from '../../../../../hooks/money/use-upgrade-money-account';
import { useConfirmationNavigationOptions } from '../../../hooks/useConfirmationNavigation';
import { CustomAmountInfo } from '../custom-amount-info';
import { MUSD_TOKEN_ADDRESS } from '../../../constants/musd';
import { MoneyAccountDepositInfo } from './money-account-deposit-info';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/tokens/useAddToken', () => ({
  useAddToken: jest.fn(),
}));

jest.mock('../custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(() => <div data-testid="custom-amount-info" />),
}));

jest.mock('../../../../../hooks/money/use-upgrade-money-account', () => ({
  useUpgradeMoneyAccount: jest.fn(),
}));

jest.mock('../../../hooks/useConfirmationNavigation', () => ({
  useConfirmationNavigationOptions: jest.fn(),
}));

const useSelectorMock = jest.mocked(useSelector);
const useAddTokenMock = jest.mocked(useAddToken);
const useConfirmationNavigationOptionsMock = jest.mocked(
  useConfirmationNavigationOptions,
);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);
const useUpgradeMoneyAccountMock = jest.mocked(useUpgradeMoneyAccount);

describe('MoneyAccountDepositInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useConfirmationNavigationOptionsMock.mockReturnValue({});
    useSelectorMock.mockReturnValue(undefined);
  });

  it('upgrades the Money account while mounted', () => {
    render(<MoneyAccountDepositInfo />);

    expect(useUpgradeMoneyAccountMock).toHaveBeenCalled();
  });

  it('registers mUSD on the vault chain so Pay can resolve the required token', () => {
    useSelectorMock.mockReturnValue({ chainId: CHAIN_IDS.MONAD });

    render(<MoneyAccountDepositInfo />);

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: CHAIN_IDS.MONAD,
      decimals: 6,
      symbol: 'mUSD',
      tokenAddress: MUSD_TOKEN_ADDRESS,
    });
  });

  it('falls back to Monad when the vault config is not served', () => {
    render(<MoneyAccountDepositInfo />);

    expect(useAddTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: CHAIN_IDS.MONAD }),
    );
  });

  it('renders CustomAmountInfo with the account row for a USD fiat deposit', () => {
    render(<MoneyAccountDepositInfo />);

    expect(screen.getByTestId('custom-amount-info')).toBeInTheDocument();
    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amountDetails: expect.any(Function),
        autoFocusAmount: true,
        currency: 'usd',
        displayAccountRow: true,
        displayPercentageButtons: true,
        hidePayTokenAmount: true,
      }),
      expect.anything(),
    );
  });

  it('passes the preferred payment token from the route to CustomAmountInfo', () => {
    useConfirmationNavigationOptionsMock.mockReturnValue({
      preferredPaymentToken: { address: '0xabc', chainId: '0x1' },
    });

    render(<MoneyAccountDepositInfo />);

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredToken: { address: '0xabc', chainId: '0x1' },
      }),
      expect.anything(),
    );
  });
});
