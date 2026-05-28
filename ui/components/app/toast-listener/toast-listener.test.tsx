import React from 'react';
import { render } from '@testing-library/react';
import { tEn } from '../../../../test/lib/i18n-helpers';
import {
  PERPS_CONFIRMATION_STARTUP_FLOW,
  PERPS_STARTUP_ERROR_ROUTE_STATE_KEY,
} from '../../../pages/confirmations/constants/perps';
import { ToastListener } from './toast-listener';

const mockUseSelector = jest.fn();
const mockUseSmartTransactionToasts = jest.fn();
const mockPerpsDepositToast = jest.fn(() => null);
const mockUsePerpsWithdrawTransactionToasts = jest.fn();
const mockIsInteractiveUI = jest.fn();
const mockNavigate = jest.fn();
const mockToastError = jest.fn();
const mockTriggerPerpsWithdrawNavigation = jest.fn();
const mockT = (key: string) => tEn(key);
let mockLocation = {
  pathname: '/',
  search: '',
  state: null as unknown,
};

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
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

jest.mock('../perps/hooks/usePerpsWithdrawNavigation', () => ({
  usePerpsWithdrawNavigation: () => ({
    trigger: mockTriggerPerpsWithdrawNavigation,
  }),
}));

jest.mock('../../ui/toast/toast', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
  ToastContent: () => null,
}));

jest.mock('./usePerpsWithdrawTransactionToasts', () => ({
  usePerpsWithdrawTransactionToasts: () =>
    mockUsePerpsWithdrawTransactionToasts(),
}));

describe('ToastListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation = {
      pathname: '/',
      search: '',
      state: null,
    };
    mockTriggerPerpsWithdrawNavigation.mockResolvedValue({
      route: '/confirm-transaction/withdraw-tx-id',
    });
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

  it('shows withdraw startup error toast from route state and clears route state', () => {
    mockLocation = {
      pathname: '/',
      search: '?tab=perps',
      state: {
        preserved: 'state',
        [PERPS_STARTUP_ERROR_ROUTE_STATE_KEY]:
          PERPS_CONFIRMATION_STARTUP_FLOW.WITHDRAW,
      },
    };

    renderToastListener({
      transactionToastEnabled: false,
      isInteractive: true,
    });

    const [toastContent, options] = mockToastError.mock.calls[0];

    expect(toastContent.props.title).toBe(tEn('perpsWithdrawStartErrorTitle'));
    expect(toastContent.props.description).toBe(
      tEn('perpsWithdrawStartErrorDescription'),
    );
    expect(toastContent.props.actionText).toBe(tEn('tryAgain'));
    expect(options).toStrictEqual({ id: 'perps-startup-error' });
    expect(mockNavigate).toHaveBeenCalledWith('/?tab=perps', {
      replace: true,
      state: { preserved: 'state' },
    });

    toastContent.props.onActionClick();

    expect(mockTriggerPerpsWithdrawNavigation).toHaveBeenCalledTimes(1);
  });

  it('shows deposit startup error toast from route state and clears route state', () => {
    mockLocation = {
      pathname: '/perps/trade/BTC',
      search: '',
      state: {
        [PERPS_STARTUP_ERROR_ROUTE_STATE_KEY]:
          PERPS_CONFIRMATION_STARTUP_FLOW.DEPOSIT,
      },
    };

    renderToastListener({
      transactionToastEnabled: false,
      isInteractive: true,
    });

    const [toastContent] = mockToastError.mock.calls[0];

    expect(toastContent.props.title).toBe(tEn('perpsDepositToastErrorTitle'));
    expect(toastContent.props.description).toBe(
      tEn('perpsDepositToastErrorDescription'),
    );
    expect(toastContent.props.actionText).toBeUndefined();
    expect(mockNavigate).toHaveBeenCalledWith('/perps/trade/BTC', {
      replace: true,
      state: undefined,
    });
  });
});
