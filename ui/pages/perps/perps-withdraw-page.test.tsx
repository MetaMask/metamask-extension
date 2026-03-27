import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { usePerpsEligibility } from '../../hooks/perps';
import * as accountsSelectors from '../../selectors/accounts';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { submitRequestToBackground } from '../../store/background-connection';
import PerpsWithdrawPage from './perps-withdraw-page';

jest.mock('@metamask/perps-controller', () => ({
  HYPERLIQUID_ASSET_CONFIGS: {
    usdc: {
      mainnet: 'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      testnet: 'eip155:421614/erc20:0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    },
  },
  HYPERLIQUID_WITHDRAWAL_MINUTES: 30,
  WITHDRAWAL_CONSTANTS: {
    DefaultMinAmount: '1.01',
    DefaultFeeAmount: 1,
  },
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate-to">{to}</div>
  ),
}));

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: jest.fn(),
}));

jest.mock('../../hooks/perps', () => ({
  usePerpsEligibility: jest.fn(() => ({ isEligible: true })),
}));

const mockUsePerpsEligibility = usePerpsEligibility as jest.MockedFunction<
  typeof usePerpsEligibility
>;

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: () => ({
    account: { availableBalance: '100' },
  }),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../components/app/perps/perps-wallet-account-header', () => ({
  PerpsWalletAccountHeader: () => (
    <div data-testid="perps-wallet-account-header-mock" />
  ),
}));

const mockGetIsPerpsExperienceAvailable =
  getIsPerpsExperienceAvailable as jest.MockedFunction<
    typeof getIsPerpsExperienceAvailable
  >;

const mockSubmit = submitRequestToBackground as jest.MockedFunction<
  typeof submitRequestToBackground
>;

/**
 * Await every promise returned for a given `submitRequestToBackground` method so
 * `.then()` handlers (e.g. `setWithdrawalRoutes`) run inside `act`. Handles more
 * than one call (e.g. effect re-run).
 *
 * @param method - Background RPC method name passed as the first argument.
 */
async function awaitSubmitPromisesForMethod(method: string) {
  const promises: Promise<unknown>[] = [];
  mockSubmit.mock.calls.forEach((call, i) => {
    if (call[0] !== method) {
      return;
    }
    const value = mockSubmit.mock.results[i]?.value;
    if (value && typeof (value as Promise<unknown>).then === 'function') {
      promises.push(value as Promise<unknown>);
    }
  });
  if (promises.length === 0) {
    return;
  }
  await act(async () => {
    await Promise.all(promises);
  });
}

/**
 * Wait for the mount `useEffect` that fetches withdrawal routes, then await those
 * RPC promises until no new `perpsGetWithdrawalRoutes` calls appear. `waitFor` alone
 * can pass before `.then(setState)` runs; a routes update can also re-trigger the
 * effect (dependency `[t]`), queueing another fetch whose promise must be awaited.
 */
async function settleInitialWithdrawRoutesFetch() {
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith('perpsGetWithdrawalRoutes', []);
  });

  for (let i = 0; i < 10; i += 1) {
    const countBefore = mockSubmit.mock.calls.filter(
      (call) => call[0] === 'perpsGetWithdrawalRoutes',
    ).length;
    await awaitSubmitPromisesForMethod('perpsGetWithdrawalRoutes');
    await act(async () => {
      await Promise.resolve();
    });
    const countAfter = mockSubmit.mock.calls.filter(
      (call) => call[0] === 'perpsGetWithdrawalRoutes',
    ).length;
    if (countAfter === countBefore) {
      return;
    }
  }
}

/** Await rejected `perpsGetWithdrawalRoutes` promises so the effect `catch` runs in `act`. */
async function flushRejectedWithdrawRoutesPromises() {
  await act(async () => {
    for (let i = 0; i < mockSubmit.mock.calls.length; i += 1) {
      if (mockSubmit.mock.calls[i][0] !== 'perpsGetWithdrawalRoutes') {
        continue;
      }
      const value = mockSubmit.mock.results[i]?.value;
      if (value && typeof (value as Promise<unknown>).then === 'function') {
        await (value as Promise<unknown>).catch(() => undefined);
      }
    }
  });
}

/** `handleWithdraw` is async; `finally` sets `isSubmitting` false after mocks resolve. */
async function waitForWithdrawHandlerSettled() {
  await waitFor(() => {
    expect(screen.getByTestId('perps-withdraw-submit')).not.toBeDisabled();
  });
}

describe('PerpsWithdrawPage', () => {
  const createMockStore = () =>
    configureStore({
      metamask: {
        ...mockState.metamask,
        isTestnet: false,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
    mockSubmit.mockImplementation((method: string) => {
      if (method === 'perpsGetWithdrawalRoutes') {
        return Promise.resolve([
          {
            assetId:
              'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            chainId: 'eip155:42161',
            contractAddress:
              '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
            constraints: { minAmount: '1.01' },
          },
        ]);
      }
      if (method === 'perpsValidateWithdrawal') {
        return Promise.resolve({ isValid: true });
      }
      if (method === 'perpsWithdraw') {
        return Promise.resolve({ success: true, withdrawalId: 'hl_test' });
      }
      return Promise.resolve(undefined);
    });
  });

  it('renders when perps experience is available', async () => {
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    expect(screen.getByTestId('perps-withdraw-page')).toBeInTheDocument();
    expect(screen.getByTestId('perps-withdraw-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('perps-withdraw-submit')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-withdraw-summary-receive-value'),
    ).toHaveTextContent('—');
  });

  it('redirects when perps experience is disabled', async () => {
    mockGetIsPerpsExperienceAvailable.mockReturnValue(false);

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/');
  });

  it('submits withdrawal when amount is valid', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    // `user.click` resolves before the async `handleWithdraw` finishes; await the
    // same background promises so `setState` / `finally` run inside `act`.
    await awaitSubmitPromisesForMethod('perpsValidateWithdrawal');
    await awaitSubmitPromisesForMethod('perpsWithdraw');

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsValidateWithdrawal',
        expect.any(Array),
      );
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsWithdraw',
        expect.any(Array),
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    await waitForWithdrawHandlerSettled();
  });

  it('navigates home when cancel is pressed', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    await user.click(screen.getByTestId('perps-withdraw-cancel'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('does not accept more than six decimal places in the amount field', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '1.1234567');

    expect(amountInput).toHaveValue('1.123456');
  });

  it('does not call perpsValidateWithdrawal when no account is selected', async () => {
    const user = userEvent.setup();
    const spy = jest
      .spyOn(accountsSelectors, 'getSelectedInternalAccount')
      .mockReturnValue(undefined as never);

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    expect(
      await screen.findByText(messages.perpsWithdrawNoAccount.message),
    ).toBeInTheDocument();

    expect(mockSubmit).not.toHaveBeenCalledWith(
      'perpsValidateWithdrawal',
      expect.any(Array),
    );

    spy.mockRestore();
  });

  it('accepts six decimal places and submits withdrawal', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '10.123456');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await awaitSubmitPromisesForMethod('perpsValidateWithdrawal');
    await awaitSubmitPromisesForMethod('perpsWithdraw');

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsValidateWithdrawal',
        expect.any(Array),
      );
    });

    await waitForWithdrawHandlerSettled();
  });

  it('clears controller withdraw result when withdrawal fails', async () => {
    const user = userEvent.setup();
    mockSubmit.mockImplementation((method: string) => {
      if (method === 'perpsGetWithdrawalRoutes') {
        return Promise.resolve([
          {
            assetId:
              'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            chainId: 'eip155:42161',
            contractAddress:
              '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
            constraints: { minAmount: '1.01' },
          },
        ]);
      }
      if (method === 'perpsValidateWithdrawal') {
        return Promise.resolve({ isValid: true });
      }
      if (method === 'perpsWithdraw') {
        return Promise.resolve({ success: false, error: 'provider_error' });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await awaitSubmitPromisesForMethod('perpsValidateWithdrawal');
    await awaitSubmitPromisesForMethod('perpsWithdraw');

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('perpsClearWithdrawResult', []);
    });

    await waitForWithdrawHandlerSettled();
    await awaitSubmitPromisesForMethod('perpsClearWithdrawResult');
  });

  it('shows minimum withdrawal notice when amount is below the route minimum', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '1');

    expect(await screen.findByText(/Minimum withdrawal/iu)).toBeInTheDocument();
  });

  it('shows insufficient balance when amount exceeds available Perps balance', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '101');

    expect(
      await screen.findByText(messages.perpsWithdrawInsufficient.message),
    ).toBeInTheDocument();
  });

  it('shows geo-blocked copy and disables submit when user is not eligible', async () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    expect(
      screen.getByText(messages.perpsGeoBlockedTooltip.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-withdraw-percentage-buttons'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toBeDisabled();
    expect(screen.getByTestId('perps-withdraw-submit')).toBeDisabled();
  });

  it('fills amount from Max and 50% quick actions', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    await user.click(screen.getByTestId('perps-withdraw-percentage-max'));
    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '100',
    );

    await user.click(screen.getByTestId('perps-withdraw-percentage-50'));
    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '50',
    );
  });

  it('shows server validation error when perpsValidateWithdrawal returns invalid', async () => {
    const user = userEvent.setup();
    mockSubmit.mockImplementation((method: string) => {
      if (method === 'perpsGetWithdrawalRoutes') {
        return Promise.resolve([
          {
            assetId:
              'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            chainId: 'eip155:42161',
            contractAddress:
              '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
            constraints: { minAmount: '1.01' },
          },
        ]);
      }
      if (method === 'perpsValidateWithdrawal') {
        return Promise.resolve({
          isValid: false,
          error: 'blocked_by_provider',
        });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await awaitSubmitPromisesForMethod('perpsValidateWithdrawal');

    expect(await screen.findByText('blocked_by_provider')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalledWith(
      'perpsWithdraw',
      expect.any(Array),
    );

    await waitForWithdrawHandlerSettled();
  });

  it('shows generic invalid message when validation fails without an error string', async () => {
    const user = userEvent.setup();
    mockSubmit.mockImplementation((method: string) => {
      if (method === 'perpsGetWithdrawalRoutes') {
        return Promise.resolve([
          {
            assetId:
              'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            chainId: 'eip155:42161',
            contractAddress:
              '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
            constraints: { minAmount: '1.01' },
          },
        ]);
      }
      if (method === 'perpsValidateWithdrawal') {
        return Promise.resolve({ isValid: false });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await awaitSubmitPromisesForMethod('perpsValidateWithdrawal');

    expect(
      await screen.findByText(messages.perpsWithdrawInvalidAmount.message),
    ).toBeInTheDocument();

    await waitForWithdrawHandlerSettled();
  });

  it('shows failure message and clears withdraw result when perpsWithdraw throws', async () => {
    const user = userEvent.setup();
    mockSubmit.mockImplementation((method: string) => {
      if (method === 'perpsGetWithdrawalRoutes') {
        return Promise.resolve([
          {
            assetId:
              'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            chainId: 'eip155:42161',
            contractAddress:
              '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
            constraints: { minAmount: '1.01' },
          },
        ]);
      }
      if (method === 'perpsValidateWithdrawal') {
        return Promise.resolve({ isValid: true });
      }
      if (method === 'perpsWithdraw') {
        return Promise.reject(new Error('network'));
      }
      if (method === 'perpsClearWithdrawResult') {
        return Promise.resolve(undefined);
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await awaitSubmitPromisesForMethod('perpsValidateWithdrawal');
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsWithdraw',
        expect.any(Array),
      );
    });
    const withdrawCallIndex = mockSubmit.mock.calls.findIndex(
      (call) => call[0] === 'perpsWithdraw',
    );
    await act(async () => {
      await (
        mockSubmit.mock.results[withdrawCallIndex].value as Promise<unknown>
      ).catch(() => undefined);
    });

    expect(
      await screen.findByText(messages.perpsWithdrawFailed.message),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('perpsClearWithdrawResult', []);
    });

    await waitForWithdrawHandlerSettled();
    await awaitSubmitPromisesForMethod('perpsClearWithdrawResult');
  });

  it('survives withdrawal routes fetch rejection', async () => {
    mockSubmit.mockImplementation((method: string) => {
      if (method === 'perpsGetWithdrawalRoutes') {
        return Promise.reject(new Error('rpc'));
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('perpsGetWithdrawalRoutes', []);
    });
    await flushRejectedWithdrawRoutesPromises();

    expect(screen.getByTestId('perps-withdraw-page')).toBeInTheDocument();
  });
});
