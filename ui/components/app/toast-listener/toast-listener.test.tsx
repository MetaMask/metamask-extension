import React from 'react';
import { render } from '@testing-library/react';
import { ToastListener } from './toast-listener';

const mockUseSelector = jest.fn();
const mockUseSmartTransactionToasts = jest.fn();
const mockPerpsDepositToast = jest.fn(() => null);
const mockUsePerpsWithdrawTransactionToasts = jest.fn();
const mockIsInteractiveUI = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../../shared/lib/selectors/smart-transactions', () => ({
  getExtensionSkipTransactionStatusPage: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getIsUnlocked: jest.fn(),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  isInteractiveUI: () => mockIsInteractiveUI(),
}));

jest.mock('./useSmartTransactionToasts', () => ({
  useSmartTransactionToasts: () => mockUseSmartTransactionToasts(),
}));

jest.mock('../perps/perps-deposit-toast', () => ({
  PerpsDepositToast: () => mockPerpsDepositToast(),
}));

jest.mock('./usePerpsWithdrawTransactionToasts', () => ({
  usePerpsWithdrawTransactionToasts: () =>
    mockUsePerpsWithdrawTransactionToasts(),
}));

describe('ToastListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderToastListener({
    transactionToastEnabled,
    isInteractive,
    isUnlocked = true,
  }: {
    transactionToastEnabled: boolean;
    isInteractive: boolean;
    isUnlocked?: boolean;
  }) {
    mockUseSelector
      .mockReturnValueOnce(transactionToastEnabled)
      .mockReturnValueOnce(isUnlocked);
    mockIsInteractiveUI.mockReturnValue(isInteractive);
    render(<ToastListener />);
  }

  it('mounts toast hooks when smart transaction toasts are enabled in interactive UI', () => {
    renderToastListener({
      transactionToastEnabled: true,
      isInteractive: true,
    });

    expect(mockUseSmartTransactionToasts).toHaveBeenCalledTimes(1);
    expect(mockUsePerpsWithdrawTransactionToasts).toHaveBeenCalledTimes(1);
  });

  it('mounts only the perps withdraw toast hook when the smart transaction toast flag is disabled', () => {
    renderToastListener({
      transactionToastEnabled: false,
      isInteractive: true,
    });

    expect(mockUseSmartTransactionToasts).not.toHaveBeenCalled();
    expect(mockUsePerpsWithdrawTransactionToasts).toHaveBeenCalledTimes(1);
  });

  it('does not mount toast listeners in non-interactive UI', () => {
    renderToastListener({
      transactionToastEnabled: true,
      isInteractive: false,
    });

    expect(mockUseSmartTransactionToasts).not.toHaveBeenCalled();
    expect(mockPerpsDepositToast).not.toHaveBeenCalled();
    expect(mockUsePerpsWithdrawTransactionToasts).not.toHaveBeenCalled();
  });
});
