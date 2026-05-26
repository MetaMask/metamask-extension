import React from 'react';
import { render } from '@testing-library/react';
import { ToastListener } from './toast-listener';

const mockUseSelector = jest.fn();
const mockUseSmartTransactionToasts = jest.fn();
const mockIsInteractiveUI = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../shared/lib/selectors/smart-transactions', () => ({
  getExtensionSkipTransactionStatusPage: jest.fn(),
}));

jest.mock('../../../shared/lib/environment-type', () => ({
  isInteractiveUI: () => mockIsInteractiveUI(),
}));

jest.mock('./useSmartTransactionToasts', () => ({
  useSmartTransactionToasts: () => mockUseSmartTransactionToasts(),
}));

describe('ToastListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderToastListener({
    transactionToastEnabled,
    isInteractive,
  }: {
    transactionToastEnabled: boolean;
    isInteractive: boolean;
  }) {
    mockUseSelector.mockReturnValue(transactionToastEnabled);
    mockIsInteractiveUI.mockReturnValue(isInteractive);
    render(<ToastListener />);
  }

  it('mounts the smart transaction toast hook when enabled in interactive UI', () => {
    renderToastListener({
      transactionToastEnabled: true,
      isInteractive: true,
    });

    expect(mockUseSmartTransactionToasts).toHaveBeenCalledTimes(1);
  });

  it('does not mount the smart transaction toast hook when the flag is disabled', () => {
    renderToastListener({
      transactionToastEnabled: false,
      isInteractive: true,
    });

    expect(mockUseSmartTransactionToasts).not.toHaveBeenCalled();
  });

  it('does not mount the smart transaction toast hook in non-interactive UI', () => {
    renderToastListener({
      transactionToastEnabled: true,
      isInteractive: false,
    });

    expect(mockUseSmartTransactionToasts).not.toHaveBeenCalled();
  });
});
