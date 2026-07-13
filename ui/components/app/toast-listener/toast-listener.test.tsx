import React from 'react';
import { render } from '@testing-library/react';
import { ToastListener } from './toast-listener';

const mockUseSelector = jest.fn();
const mockPerpsDepositToast = jest.fn(() => null);
const mockUsePerpsWithdrawTransactionToasts = jest.fn();
const mockUseMusdConversionToastStatus = jest.fn(() => ({
  activeTransactionId: undefined,
}));
const mockUseMusdConversionConfirmTrace = jest.fn();
const mockIsInteractiveUI = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../ducks/metamask/base-selectors', () => ({
  getIsUnlocked: jest.fn(),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  isInteractiveUI: () => mockIsInteractiveUI(),
}));

jest.mock('../perps/perps-deposit-toast', () => ({
  PerpsDepositToast: () => mockPerpsDepositToast(),
}));

jest.mock('../../../hooks/musd', () => ({
  useMusdConversionToastStatus: () => mockUseMusdConversionToastStatus(),
  useMusdConversionConfirmTrace: (...args: unknown[]) =>
    mockUseMusdConversionConfirmTrace(...args),
}));

jest.mock('./usePerpsWithdrawTransactionToasts', () => ({
  usePerpsWithdrawTransactionToasts: () =>
    mockUsePerpsWithdrawTransactionToasts(),
}));

jest.mock('./transaction-event-toast-listener', () => ({
  TransactionEventToastListener: () => null,
}));

describe('ToastListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderToastListener({
    isInteractive,
    isUnlocked = true,
  }: {
    isInteractive: boolean;
    isUnlocked?: boolean;
  }) {
    mockUseSelector.mockReturnValueOnce(isUnlocked);
    mockIsInteractiveUI.mockReturnValue(isInteractive);
    render(<ToastListener />);
  }

  it('mounts toast hooks in interactive UI', () => {
    renderToastListener({ isInteractive: true });

    expect(mockUsePerpsWithdrawTransactionToasts).toHaveBeenCalledTimes(1);
    expect(mockUseMusdConversionToastStatus).toHaveBeenCalledTimes(1);
    expect(mockUseMusdConversionConfirmTrace).toHaveBeenCalledWith('');
  });

  it('does not mount toast listeners in non-interactive UI', () => {
    renderToastListener({ isInteractive: false });

    expect(mockPerpsDepositToast).not.toHaveBeenCalled();
    expect(mockUsePerpsWithdrawTransactionToasts).not.toHaveBeenCalled();
    expect(mockUseMusdConversionToastStatus).not.toHaveBeenCalled();
    expect(mockUseMusdConversionConfirmTrace).not.toHaveBeenCalled();
  });
});
