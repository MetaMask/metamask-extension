import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { useMoneyAccountWithdrawal } from '../../../../hooks/money/useMoneyAccountWithdrawal';
import { useMoneyPerpsDeposit } from '../../../../hooks/money/useMoneyPerpsDeposit';
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../../../hooks/money/useMoneyAnalytics.mock';
import {
  MoneyBottomSheetName,
  MoneyComponentName,
  MoneyScreenName,
} from '../../constants/money-events';
import {
  MoneyTransferSheet,
  MONEY_TRANSFER_SHEET_TEST_IDS,
} from './money-transfer-sheet';

jest.mock('../../../../hooks/money/useMoneyAccountWithdrawal');
jest.mock('../../../../hooks/money/useMoneyPerpsDeposit');

const mockMoneyAnalytics = createMoneyAnalyticsMock();
jest.mock('../../../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

const useMoneyAccountWithdrawalMock = jest.mocked(useMoneyAccountWithdrawal);
const useMoneyPerpsDepositMock = jest.mocked(useMoneyPerpsDeposit);

describe('MoneyTransferSheet', () => {
  const onClose = jest.fn();
  const initiateWithdrawal = jest.fn().mockResolvedValue(undefined);
  const initiatePerpsDeposit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
    useMoneyAccountWithdrawalMock.mockReturnValue({
      initiateWithdrawal,
      isLoading: false,
    });
    useMoneyPerpsDepositMock.mockReturnValue({
      isEnabled: true,
      isEligible: true,
      initiatePerpsDeposit,
      isLoading: false,
    });
  });

  it('renders send destinations including Perps account', () => {
    renderWithLocalization(<MoneyTransferSheet isOpen onClose={onClose} />);

    expect(
      screen.getByText(messages.moneyTransferTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.betweenAccounts),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.perpsAccount),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.sendExternal),
    ).toBeDisabled();
    expect(
      screen.getByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.withdrawToBank),
    ).toBeDisabled();
  });

  it('hides Perps when the user is not eligible', () => {
    useMoneyPerpsDepositMock.mockReturnValue({
      isEnabled: false,
      isEligible: false,
      initiatePerpsDeposit,
      isLoading: false,
    });

    renderWithLocalization(<MoneyTransferSheet isOpen onClose={onClose} />);

    expect(
      screen.queryByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.perpsAccount),
    ).not.toBeInTheDocument();
  });

  it('disables Perps when the money-account flag is off', () => {
    useMoneyPerpsDepositMock.mockReturnValue({
      isEnabled: false,
      isEligible: true,
      initiatePerpsDeposit,
      isLoading: false,
    });

    renderWithLocalization(<MoneyTransferSheet isOpen onClose={onClose} />);

    expect(
      screen.getByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.perpsAccount),
    ).toBeDisabled();
  });

  it('closes and initiates a money-funded Perps deposit', () => {
    renderWithLocalization(<MoneyTransferSheet isOpen onClose={onClose} />);

    fireEvent.click(
      screen.getByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.perpsAccount),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(initiatePerpsDeposit).toHaveBeenCalledTimes(1);
    expect(mockMoneyAnalytics.trackSurfaceClicked).toHaveBeenCalledWith({
      componentName: MoneyComponentName.TransferMoneySheetPerpsAccount,
      redirectTarget: MoneyScreenName.MoneyTransfer,
    });
  });

  it('closes and initiates a between-accounts withdrawal', () => {
    renderWithLocalization(<MoneyTransferSheet isOpen onClose={onClose} />);

    fireEvent.click(
      screen.getByTestId(MONEY_TRANSFER_SHEET_TEST_IDS.betweenAccounts),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(initiateWithdrawal).toHaveBeenCalledTimes(1);
    expect(mockMoneyAnalytics.trackSurfaceClicked).toHaveBeenCalledWith({
      componentName: MoneyComponentName.TransferMoneySheetBetweenAccounts,
      redirectTarget: MoneyScreenName.MoneyTransfer,
    });
  });

  it('tracks the sheet as viewed once when opened', () => {
    const { rerender } = renderWithLocalization(
      <MoneyTransferSheet isOpen onClose={onClose} />,
    );
    rerender(<MoneyTransferSheet isOpen onClose={onClose} />);

    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      bottomSheetName: MoneyBottomSheetName.TransferMoneySheet,
    });
    expect(mockMoneyAnalytics.trackBottomSheetViewed).toHaveBeenCalledTimes(1);
  });
});
