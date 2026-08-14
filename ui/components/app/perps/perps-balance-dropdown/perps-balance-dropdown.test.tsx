import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockAccountState, mockPositions } from '../mocks';
import {
  PerpsBalanceDropdown,
  invokePerpsBalanceAction,
} from './perps-balance-dropdown';

// Mobile test convention: mock the Compliance barrel so the gate hook never runs
// (and never reaches the now-strict AccessRestrictedProvider context throw). The
// gate is a passthrough here; real gating behavior is covered in
// useComplianceGate.test.tsx.
jest.mock('../../compliance', () => {
  // Stable references so components that put `gate` in effect/callback deps
  // don't re-run on every render.
  const gate = async (action: () => unknown) => action();
  const value = {
    gate,
    isComplianceEnabled: false,
    isBlocked: false,
    checkCompliance: jest.fn(),
  };
  return {
    useComplianceGate: () => value,
    useSelectedAccountComplianceGate: () => value,
  };
});

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number, _currency: string) =>
      `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    formatPercentWithMinThreshold: (value: number) =>
      `${(value * 100).toFixed(2)}%`,
  }),
}));

const mockUsePerpsLiveAccount = jest.fn().mockReturnValue({
  account: mockAccountState,
  isInitialLoading: false,
});

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: (...args: unknown[]) => mockUsePerpsLiveAccount(...args),
}));

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('invokePerpsBalanceAction', () => {
  it('logs when callback returns a rejected promise', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    invokePerpsBalanceAction(() => Promise.reject(new Error('fail')));

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('does nothing when callback is undefined', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    invokePerpsBalanceAction(undefined);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('PerpsBalanceDropdown', () => {
  it('renders the balance dropdown component', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(screen.getByTestId('perps-balance-dropdown')).toBeInTheDocument();
  });

  it('displays the total balance label', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(screen.getByText(/total balance/iu)).toBeInTheDocument();
  });

  it('displays the formatted total balance from mock data', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(screen.getByText('$15,250')).toBeInTheDocument();
  });

  it('renders loading skeleton when account data is still loading', () => {
    mockUsePerpsLiveAccount.mockReturnValueOnce({
      account: null,
      isInitialLoading: true,
    });

    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(
      screen.getByTestId('perps-control-bar-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-balance-dropdown-balance'),
    ).not.toBeInTheDocument();
  });

  it('toggles dropdown when balance row is clicked', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(
      screen.queryByTestId('perps-balance-dropdown-panel'),
    ).not.toBeInTheDocument();

    const balanceRow = screen.getByTestId('perps-balance-dropdown-balance');
    fireEvent.click(balanceRow);

    expect(
      screen.getByTestId('perps-balance-dropdown-panel'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-balance-dropdown-add-funds'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-balance-dropdown-withdraw'),
    ).toBeInTheDocument();

    fireEvent.click(balanceRow);

    expect(
      screen.queryByTestId('perps-balance-dropdown-panel'),
    ).not.toBeInTheDocument();
  });

  it('calls onAddFunds when Add funds button is clicked', () => {
    const onAddFunds = jest.fn();
    renderWithProvider(
      <PerpsBalanceDropdown onAddFunds={onAddFunds} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-balance-dropdown-balance'));
    fireEvent.click(screen.getByTestId('perps-balance-dropdown-add-funds'));

    expect(onAddFunds).toHaveBeenCalledTimes(1);
  });

  it('calls onWithdraw when Withdraw button is clicked', () => {
    const onWithdraw = jest.fn();
    renderWithProvider(
      <PerpsBalanceDropdown onWithdraw={onWithdraw} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-balance-dropdown-balance'));
    fireEvent.click(screen.getByTestId('perps-balance-dropdown-withdraw'));

    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it('logs when onWithdraw returns a rejected promise', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const onWithdraw = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error('withdraw failed')));

    renderWithProvider(
      <PerpsBalanceDropdown onWithdraw={onWithdraw} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-balance-dropdown-balance'));
    fireEvent.click(screen.getByTestId('perps-balance-dropdown-withdraw'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
  });

  it('does not show P&L row when hasPositions is false', () => {
    renderWithProvider(
      <PerpsBalanceDropdown hasPositions={false} />,
      mockStore,
    );

    expect(
      screen.queryByTestId('perps-balance-dropdown-pnl'),
    ).not.toBeInTheDocument();
  });

  it('shows P&L row when hasPositions is true', () => {
    renderWithProvider(<PerpsBalanceDropdown hasPositions />, mockStore);

    expect(
      screen.getByTestId('perps-balance-dropdown-pnl'),
    ).toBeInTheDocument();
  });

  it('displays the unrealized P&L label when hasPositions is true', () => {
    renderWithProvider(<PerpsBalanceDropdown hasPositions />, mockStore);

    expect(screen.getByText(/unrealized p&l/iu)).toBeInTheDocument();
  });

  it('displays formatted P&L value when hasPositions is true', () => {
    renderWithProvider(<PerpsBalanceDropdown hasPositions />, mockStore);

    expect(screen.getByText(/\+\$375/u)).toBeInTheDocument();
    expect(screen.getByText(/7\.32%/u)).toBeInTheDocument();
  });

  it('uses the single position RoE when provided', () => {
    mockUsePerpsLiveAccount.mockReturnValueOnce({
      account: {
        ...mockAccountState,
        returnOnEquity: '1',
      },
      isInitialLoading: false,
    });

    renderWithProvider(
      <PerpsBalanceDropdown
        hasPositions
        singlePosition={{
          ...mockPositions[0],
          returnOnEquity: '0.42',
        }}
      />,
      mockStore,
    );

    expect(screen.getByText(/42\.00%/u)).toBeInTheDocument();
    expect(screen.queryByText(/1\.00%/u)).not.toBeInTheDocument();
  });

  describe('geo-blocking', () => {
    it('shows geo-block modal and does not call onAddFunds when user is not eligible', () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      const onAddFunds = jest.fn();
      renderWithProvider(
        <PerpsBalanceDropdown onAddFunds={onAddFunds} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-dropdown-balance'));
      fireEvent.click(screen.getByTestId('perps-balance-dropdown-add-funds'));

      expect(onAddFunds).not.toHaveBeenCalled();
      expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    });
  });

  describe('privacy mode', () => {
    const privacyStore = configureStore({
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          privacyMode: true,
        },
      },
    });

    it('masks the total balance when privacy mode is enabled', () => {
      renderWithProvider(<PerpsBalanceDropdown />, privacyStore);

      expect(screen.queryByText('$15,250')).not.toBeInTheDocument();
      expect(screen.getByText('••••••')).toBeInTheDocument();
    });

    it('masks the P&L and RoE when privacy mode is enabled', () => {
      renderWithProvider(<PerpsBalanceDropdown hasPositions />, privacyStore);

      expect(screen.queryByText(/\+\$375/u)).not.toBeInTheDocument();
      expect(screen.queryByText(/7\.32%/u)).not.toBeInTheDocument();
      expect(screen.getAllByText('••••••')).toHaveLength(3);
    });

    it('uses the default text color instead of green/red for P&L and RoE when privacy mode is enabled', () => {
      renderWithProvider(<PerpsBalanceDropdown hasPositions />, privacyStore);

      const pnl = screen.getByTestId('perps-balance-dropdown-pnl-value');
      const roe = screen.getByTestId('perps-balance-dropdown-roe-value');
      expect(pnl).toHaveClass('text-default');
      expect(pnl).not.toHaveClass('text-success-default');
      expect(pnl).not.toHaveClass('text-error-default');
      expect(roe).toHaveClass('text-default');
      expect(roe).not.toHaveClass('text-success-default');
      expect(roe).not.toHaveClass('text-error-default');
    });
  });

  it('uses the success color for a profitable P&L outside of privacy mode', () => {
    renderWithProvider(<PerpsBalanceDropdown hasPositions />, mockStore);

    expect(screen.getByTestId('perps-balance-dropdown-pnl-value')).toHaveClass(
      'text-success-default',
    );
  });
});
