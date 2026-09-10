import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { useMoneyAccountAvailability } from '../../../../../hooks/money/use-money-account-availability';
import { useUpgradeMoneyAccount } from '../../../../../hooks/money/use-upgrade-money-account';
import { CustomAmountInfo } from '../custom-amount-info';
import {
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN_ADDRESS,
} from '../../../constants/musd';
import { MoneyAccountDepositInfo } from './money-account-deposit-info';

jest.mock('../../../hooks/tokens/useAddToken', () => ({
  useAddToken: jest.fn(),
}));

jest.mock('../custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(() => <div data-testid="custom-amount-info" />),
}));

jest.mock('../../../../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: jest.fn(),
}));

jest.mock('../../../../../hooks/money/use-upgrade-money-account', () => ({
  useUpgradeMoneyAccount: jest.fn(),
}));

const useAddTokenMock = jest.mocked(useAddToken);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);
const useMoneyAccountAvailabilityMock = jest.mocked(
  useMoneyAccountAvailability,
);
const useUpgradeMoneyAccountMock = jest.mocked(useUpgradeMoneyAccount);

const MONEY_ADDRESS = '0x0000000000000000000000000000000000000001';

describe('MoneyAccountDepositInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMoneyAccountAvailabilityMock.mockReturnValue({
      availability: { isAvailable: true, address: MONEY_ADDRESS },
    } as unknown as ReturnType<typeof useMoneyAccountAvailability>);
  });

  it('upgrades the Money account for its available address', () => {
    render(<MoneyAccountDepositInfo />);

    expect(useUpgradeMoneyAccountMock).toHaveBeenCalledWith(MONEY_ADDRESS);
  });

  it('passes no address to the upgrade while the account is unavailable', () => {
    useMoneyAccountAvailabilityMock.mockReturnValue({
      availability: { isAvailable: false },
    } as unknown as ReturnType<typeof useMoneyAccountAvailability>);

    render(<MoneyAccountDepositInfo />);

    expect(useUpgradeMoneyAccountMock).toHaveBeenCalledWith(undefined);
  });

  it('registers the mUSD token via useAddToken with the branded symbol', () => {
    render(<MoneyAccountDepositInfo />);

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
      decimals: 6,
      symbol: 'mUSD',
      tokenAddress: MUSD_TOKEN_ADDRESS,
    });
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
});
