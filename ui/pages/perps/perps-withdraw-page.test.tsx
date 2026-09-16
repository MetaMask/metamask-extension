import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccountState } from '@metamask/perps-controller';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { usePerpsEligibility } from '../../hooks/perps';
import * as accountsSelectors from '../../../shared/lib/selectors/accounts';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EXTENSION_EVENT_PROPERTY,
} from '../../../shared/constants/perps-events';
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import PerpsWithdrawPage from './perps-withdraw-page';

jest.mock('@metamask/perps-controller', () => ({
  ...jest.requireActual('@metamask/perps-controller'),
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
  PERPS_ERROR_CODES: {
    CLIENT_NOT_INITIALIZED: 'CLIENT_NOT_INITIALIZED',
    CLIENT_REINITIALIZING: 'CLIENT_REINITIALIZING',
    PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
    TOKEN_NOT_SUPPORTED: 'TOKEN_NOT_SUPPORTED',
    BRIDGE_CONTRACT_NOT_FOUND: 'BRIDGE_CONTRACT_NOT_FOUND',
    WITHDRAW_FAILED: 'WITHDRAW_FAILED',
    POSITIONS_FAILED: 'POSITIONS_FAILED',
    ACCOUNT_STATE_FAILED: 'ACCOUNT_STATE_FAILED',
    MARKETS_FAILED: 'MARKETS_FAILED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    ORDER_LEVERAGE_REDUCTION_FAILED: 'ORDER_LEVERAGE_REDUCTION_FAILED',
    IOC_CANCEL: 'IOC_CANCEL',
    CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
    WITHDRAW_ASSET_ID_REQUIRED: 'WITHDRAW_ASSET_ID_REQUIRED',
    WITHDRAW_AMOUNT_REQUIRED: 'WITHDRAW_AMOUNT_REQUIRED',
    WITHDRAW_AMOUNT_POSITIVE: 'WITHDRAW_AMOUNT_POSITIVE',
    WITHDRAW_INVALID_DESTINATION: 'WITHDRAW_INVALID_DESTINATION',
    WITHDRAW_ASSET_NOT_SUPPORTED: 'WITHDRAW_ASSET_NOT_SUPPORTED',
    WITHDRAW_INSUFFICIENT_BALANCE: 'WITHDRAW_INSUFFICIENT_BALANCE',
    DEPOSIT_ASSET_ID_REQUIRED: 'DEPOSIT_ASSET_ID_REQUIRED',
    DEPOSIT_AMOUNT_REQUIRED: 'DEPOSIT_AMOUNT_REQUIRED',
    DEPOSIT_AMOUNT_POSITIVE: 'DEPOSIT_AMOUNT_POSITIVE',
    DEPOSIT_MINIMUM_AMOUNT: 'DEPOSIT_MINIMUM_AMOUNT',
    ORDER_COIN_REQUIRED: 'ORDER_COIN_REQUIRED',
    ORDER_LIMIT_PRICE_REQUIRED: 'ORDER_LIMIT_PRICE_REQUIRED',
    ORDER_PRICE_POSITIVE: 'ORDER_PRICE_POSITIVE',
    ORDER_UNKNOWN_COIN: 'ORDER_UNKNOWN_COIN',
    ORDER_SIZE_POSITIVE: 'ORDER_SIZE_POSITIVE',
    ORDER_PRICE_REQUIRED: 'ORDER_PRICE_REQUIRED',
    ORDER_SIZE_MIN: 'ORDER_SIZE_MIN',
    ORDER_LEVERAGE_INVALID: 'ORDER_LEVERAGE_INVALID',
    ORDER_LEVERAGE_BELOW_POSITION: 'ORDER_LEVERAGE_BELOW_POSITION',
    ORDER_MAX_VALUE_EXCEEDED: 'ORDER_MAX_VALUE_EXCEEDED',
    EXCHANGE_CLIENT_NOT_AVAILABLE: 'EXCHANGE_CLIENT_NOT_AVAILABLE',
    INFO_CLIENT_NOT_AVAILABLE: 'INFO_CLIENT_NOT_AVAILABLE',
    SUBSCRIPTION_CLIENT_NOT_AVAILABLE: 'SUBSCRIPTION_CLIENT_NOT_AVAILABLE',
    NO_ACCOUNT_SELECTED: 'NO_ACCOUNT_SELECTED',
    KEYRING_LOCKED: 'KEYRING_LOCKED',
    INVALID_ADDRESS_FORMAT: 'INVALID_ADDRESS_FORMAT',
    TRANSFER_FAILED: 'TRANSFER_FAILED',
    SWAP_FAILED: 'SWAP_FAILED',
    SPOT_PAIR_NOT_FOUND: 'SPOT_PAIR_NOT_FOUND',
    PRICE_UNAVAILABLE: 'PRICE_UNAVAILABLE',
    BATCH_CANCEL_FAILED: 'BATCH_CANCEL_FAILED',
    BATCH_CLOSE_FAILED: 'BATCH_CLOSE_FAILED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
    POSITION_WOULD_FLIP: 'POSITION_WOULD_FLIP',
    MARGIN_ADJUSTMENT_FAILED: 'MARGIN_ADJUSTMENT_FAILED',
    TPSL_UPDATE_FAILED: 'TPSL_UPDATE_FAILED',
    ORDER_REJECTED: 'ORDER_REJECTED',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
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

const mockTrack = jest.fn();

jest.mock('../../hooks/perps', () => ({
  usePerpsEligibility: jest.fn(() => ({ isEligible: true })),
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

const mockUsePerpsEligibility = usePerpsEligibility as jest.MockedFunction<
  typeof usePerpsEligibility
>;

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: jest.fn(),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockGetIsPerpsExperienceAvailable =
  getIsPerpsExperienceAvailable as jest.MockedFunction<
    typeof getIsPerpsExperienceAvailable
  >;

const mockSubmit = submitRequestToBackground as jest.MockedFunction<
  typeof submitRequestToBackground
>;
const mockUsePerpsLiveAccount = usePerpsLiveAccount as jest.MockedFunction<
  typeof usePerpsLiveAccount
>;

/**
 * Build a complete `AccountState` from the few fields a test cares about.
 *
 * Typed rather than `{ … } as never`, so a shape change in the controller's
 * `AccountState` surfaces here instead of being silenced.
 *
 * @param partial - Fields this test needs; everything else defaults to '0'.
 */
function makeAccountState(partial: Partial<AccountState> = {}): AccountState {
  const spendableBalance = partial.spendableBalance ?? '0';
  return {
    totalBalance: spendableBalance,
    spendableBalance,
    // Mirrors spendable unless the caller sets it. `getTradeableBalance` prefers
    // `withdrawableBalance ?? spendableBalance`, so a literal '0' default here
    // would zero the balance for every test that only sets spendable.
    withdrawableBalance: spendableBalance,
    marginUsed: '0',
    unrealizedPnl: '0',
    returnOnEquity: '0',
    ...partial,
  };
}

/**
 * A `subAccountBreakdown` entry. Only the key count matters to the page, but the
 * balances are required by the type.
 */
function makeSubAccount(): NonNullable<
  AccountState['subAccountBreakdown']
>[string] {
  return {
    spendableBalance: '0',
    withdrawableBalance: '0',
    totalBalance: '0',
  };
}

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

/**
 * Same wait for a blocked submit: the entered amount now exceeds the adopted
 * fresh balance, so the submit button stays disabled and the quick-action
 * buttons are what re-enable when `isSubmitting` clears.
 */
async function waitForBlockedWithdrawSettled() {
  await waitFor(() => {
    expect(
      screen.getByTestId('perps-withdraw-percentage-max'),
    ).not.toBeDisabled();
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
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({ spendableBalance: '100' }),
      isInitialLoading: false,
    });
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({ withdrawableBalance: '100' });
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

    expect(
      screen.getByTestId('parent-selector-perps-withdraw'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-withdraw-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('perps-withdraw-submit')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-withdraw-summary-receive-value'),
    ).toHaveTextContent('—');
  });

  it('renders back button and Withdraw title in the header', async () => {
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    expect(
      screen.getByTestId('perps-withdraw-back-button'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-withdraw-header-title')).toHaveTextContent(
      messages.perpsWithdrawFundsTitle.message,
    );
  });

  it('clicking the back button navigates home', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    await user.click(screen.getByTestId('perps-withdraw-back-button'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
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
    await awaitSubmitPromisesForMethod('perpsGetAccountState');
    await awaitSubmitPromisesForMethod('perpsWithdraw');

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('perpsGetAccountState', []);
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

  it('does not read the account state when no account is selected', async () => {
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

    expect(mockSubmit).not.toHaveBeenCalledWith('perpsGetAccountState', []);

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

    await awaitSubmitPromisesForMethod('perpsGetAccountState');
    await awaitSubmitPromisesForMethod('perpsWithdraw');

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('perpsGetAccountState', []);
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({ withdrawableBalance: '100' });
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

    await awaitSubmitPromisesForMethod('perpsGetAccountState');
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
    expect(
      screen.getByTestId('perps-withdraw-validation-error'),
    ).toBeInTheDocument();
  });

  it('allows withdrawal even when user is geo-blocked', async () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    expect(
      screen.getByTestId('perps-withdraw-percentage-buttons'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-fiat-hero-amount-input'),
    ).not.toBeDisabled();
  });

  it('fills amount from Max and 50% quick actions', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    await user.click(screen.getByTestId('perps-withdraw-percentage-max'));
    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '100.00',
    );

    await user.click(screen.getByTestId('perps-withdraw-percentage-50'));
    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '50.00',
    );
  });

  it('uses available-to-trade balance for withdraw max and validation', async () => {
    const user = userEvent.setup();
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({
        spendableBalance: '0',
        withdrawableBalance: '100',
      }),
      isInitialLoading: false,
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    await user.click(screen.getByTestId('perps-withdraw-percentage-max'));

    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '100.00',
    );

    expect(screen.getByTestId('perps-withdraw-submit')).not.toBeDisabled();
  });

  it('blocks the withdrawal when the fresh balance is below the entered amount', async () => {
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({ withdrawableBalance: '20' });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await awaitSubmitPromisesForMethod('perpsGetAccountState');

    // The block has no other feedback, so the message must reach a screen
    // reader rather than only appearing on screen. Polite rather than
    // assertive: this line re-derives while the user is still typing.
    const validationAlert = await screen.findByTestId(
      'perps-withdraw-validation-error',
    );
    expect(validationAlert).toHaveTextContent(
      messages.perpsWithdrawInsufficient.message,
    );
    // The live region must be the wrapper, not this node: a region inserted
    // together with its text is commonly never announced.
    expect(validationAlert.parentElement).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(mockSubmit).not.toHaveBeenCalledWith(
      'perpsWithdraw',
      expect.any(Array),
    );
    expect(screen.getByTestId('perps-withdraw-submit')).toBeDisabled();

    await waitForBlockedWithdrawSettled();
  });

  it('submits the withdrawal when the fresh balance read omits a sub-account', async () => {
    const user = userEvent.setup();
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({
        spendableBalance: '100',
        subAccountBreakdown: {
          main: makeSubAccount(),
          builderdex: makeSubAccount(),
        },
      }),
      isInitialLoading: false,
    });
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({
          withdrawableBalance: '20',
          subAccountBreakdown: { '': {} },
        });
      }
      if (method === 'perpsWithdraw') {
        return Promise.resolve({ success: true, withdrawalId: 'hl_test' });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsWithdraw',
        expect.any(Array),
      );
    });

    await awaitSubmitPromisesForMethod('perpsWithdraw');
    await waitForWithdrawHandlerSettled();
  });

  it('blocks the withdrawal when the fresh read sees a sub-account the stream has not cached', async () => {
    const user = userEvent.setup();
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({
        spendableBalance: '100',
        subAccountBreakdown: { main: makeSubAccount() },
      }),
      isInitialLoading: false,
    });
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({
          withdrawableBalance: '20',
          subAccountBreakdown: { '': {}, dex1: {} },
        });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    await awaitSubmitPromisesForMethod('perpsGetAccountState');

    expect(
      await screen.findByText(messages.perpsWithdrawInsufficient.message),
    ).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalledWith(
      'perpsWithdraw',
      expect.any(Array),
    );

    await waitForBlockedWithdrawSettled();
  });

  it('shows the fresh balance in the available balance and Max after a block', async () => {
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({ withdrawableBalance: '20' });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    await awaitSubmitPromisesForMethod('perpsGetAccountState');

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$20.00`,
      ),
    ).toBeInTheDocument();

    await waitForBlockedWithdrawSettled();

    await act(async () => {
      await user.click(screen.getByTestId('perps-withdraw-percentage-max'));
    });

    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '20.00',
    );
  });

  it('releases the adopted fresh balance once the stream reports a new balance', async () => {
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({ withdrawableBalance: '20' });
      }
      return Promise.resolve(undefined);
    });

    const { rerender } = renderWithProvider(
      <PerpsWithdrawPage />,
      createMockStore(),
    );

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    await awaitSubmitPromisesForMethod('perpsGetAccountState');

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$20.00`,
      ),
    ).toBeInTheDocument();

    await waitForBlockedWithdrawSettled();

    // The stream catches up with a genuinely funded balance: the adopted figure
    // must be released, otherwise the page pins $20 for the rest of its mount.
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({ spendableBalance: '150' }),
      isInitialLoading: false,
    });
    rerender(<PerpsWithdrawPage />);

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$150.00`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-withdraw-submit')).not.toBeDisabled();
    // The block is over, so its message must go with it — otherwise the page
    // shows an error beside an enabled Submit button. Both the precise and the
    // generic copy: the latch, not the wording, is what has to clear.
    expect(
      screen.queryByText(messages.perpsWithdrawInsufficient.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.perpsWithdrawFailed.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-withdraw-validation-error'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-withdraw-submit-error'),
    ).not.toBeInTheDocument();
  });

  it('does not re-pin the released fresh balance when the stream reports the earlier value again', async () => {
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({ withdrawableBalance: '20' });
      }
      return Promise.resolve(undefined);
    });

    const { rerender } = renderWithProvider(
      <PerpsWithdrawPage />,
      createMockStore(),
    );

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    await awaitSubmitPromisesForMethod('perpsGetAccountState');

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$20.00`,
      ),
    ).toBeInTheDocument();

    await waitForBlockedWithdrawSettled();

    // The stream moves on, releasing the adopted $20.
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({ spendableBalance: '150' }),
      isInitialLoading: false,
    });
    rerender(<PerpsWithdrawPage />);

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$150.00`,
      ),
    ).toBeInTheDocument();

    // ...and then reports $100 again — a reconnect replaying the cached figure,
    // or the balance genuinely returning to it. Keying the adoption on the
    // streamed value cannot tell those apart and snaps back to the stale $20,
    // which the user cannot refresh from this page because submit is capped at
    // the pinned figure and the fresh read only runs from the submit handler.
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({ spendableBalance: '100' }),
      isInitialLoading: false,
    });
    rerender(<PerpsWithdrawPage />);

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$100.00`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-withdraw-submit')).not.toBeDisabled();
  });

  it('still tells the user why the withdrawal stopped when the stream ticks mid-read', async () => {
    const user = userEvent.setup();
    let resolveAccountState!: (value: { withdrawableBalance: string }) => void;
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
      if (method === 'perpsGetAccountState') {
        return new Promise((resolve) => {
          resolveAccountState = resolve as typeof resolveAccountState;
        });
      }
      return Promise.resolve(undefined);
    });

    const { rerender } = renderWithProvider(
      <PerpsWithdrawPage />,
      createMockStore(),
    );

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    // Serving the read woke the service worker, which reconnected the account
    // socket and pushed a new balance while the read was still in flight. The
    // adoption is keyed on the revision captured at click time, so it can no
    // longer apply — the block must still reach the user.
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({ spendableBalance: '150' }),
      isInitialLoading: false,
    });
    await act(async () => {
      rerender(<PerpsWithdrawPage />);
    });

    await act(async () => {
      resolveAccountState({ withdrawableBalance: '20' });
      await awaitSubmitPromisesForMethod('perpsGetAccountState');
    });
    await waitForBlockedWithdrawSettled();

    // Generic copy, not "Amount exceeds your available Perps balance": the
    // stream now says $150, so the precise message would contradict the screen
    // and would still be sitting there after the balance recovered.
    expect(
      await screen.findByText(messages.perpsWithdrawFailed.message),
    ).toBeInTheDocument();
    // Assertive, unlike the typing-driven validation line: a stopped submit is a
    // discrete result and is this page's only feedback for it.
    expect(screen.getByTestId('perps-withdraw-submit-error')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(
      screen.queryByText(messages.perpsWithdrawInsufficient.message),
    ).not.toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalledWith(
      'perpsWithdraw',
      expect.anything(),
    );
  });

  it('refreshes the adopted fresh balance when a later read recovers', async () => {
    const user = userEvent.setup();
    let accountStateReads = 0;
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
      if (method === 'perpsGetAccountState') {
        accountStateReads += 1;
        return Promise.resolve({
          withdrawableBalance: accountStateReads === 1 ? '20' : '100',
        });
      }
      if (method === 'perpsWithdraw') {
        return Promise.resolve({ success: true, withdrawalId: 'hl_test' });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    await awaitSubmitPromisesForMethod('perpsGetAccountState');

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$20.00`,
      ),
    ).toBeInTheDocument();

    await waitForBlockedWithdrawSettled();

    // The balance recovers while the stream stays pinned at its stale figure, so
    // only the fresh read can release the adopted $20.
    await act(async () => {
      await user.clear(amountInput);
      await user.type(amountInput, '20');
      await user.click(screen.getByTestId('perps-withdraw-submit'));
    });

    await awaitSubmitPromisesForMethod('perpsGetAccountState');
    await awaitSubmitPromisesForMethod('perpsWithdraw');

    expect(
      await screen.findByText(
        `${messages.perpsAvailableBalance.message}$100.00`,
      ),
    ).toBeInTheDocument();

    await waitForWithdrawHandlerSettled();

    await act(async () => {
      await user.click(screen.getByTestId('perps-withdraw-percentage-max'));
    });

    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '100.00',
    );
  });

  it('submits the withdrawal when the fresh balance read fails', async () => {
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
      if (method === 'perpsGetAccountState') {
        return Promise.reject(new Error('stream_unavailable'));
      }
      if (method === 'perpsWithdraw') {
        return Promise.resolve({ success: true, withdrawalId: 'hl_test' });
      }
      return Promise.resolve(undefined);
    });

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsWithdraw',
        expect.any(Array),
      );
    });

    await awaitSubmitPromisesForMethod('perpsWithdraw');
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
      if (method === 'perpsGetAccountState') {
        return Promise.resolve({ withdrawableBalance: '100' });
      }
      if (method === 'perpsWithdraw') {
        return Promise.reject(new Error('network'));
      }
      if (method === 'perpsClearWithdrawResult') {
        return Promise.resolve(undefined);
      }
      return Promise.resolve(undefined);
    });

    const { rerender } = renderWithProvider(
      <PerpsWithdrawPage />,
      createMockStore(),
    );

    await settleInitialWithdrawRoutesFetch();

    const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
    await user.clear(amountInput);
    await user.type(amountInput, '50');
    await user.click(screen.getByTestId('perps-withdraw-submit'));

    await awaitSubmitPromisesForMethod('perpsGetAccountState');
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

    // A price tick must not take the message with it. `withdrawableBalance`
    // moves with unrealized PnL, so for anyone holding a position this fires
    // constantly — and this message is the only feedback a failed withdrawal
    // has on this page.
    mockUsePerpsLiveAccount.mockReturnValue({
      account: makeAccountState({ spendableBalance: '100.01' }),
      isInitialLoading: false,
    });
    await act(async () => {
      rerender(<PerpsWithdrawPage />);
    });

    expect(
      screen.getByText(messages.perpsWithdrawFailed.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-withdraw-submit-error'),
    ).toBeInTheDocument();
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

    expect(
      screen.getByTestId('parent-selector-perps-withdraw'),
    ).toBeInTheDocument();
  });

  describe('analytics', () => {
    it('leaves the withdrawal transaction event to the controller on success', async () => {
      const user = userEvent.setup();
      renderWithProvider(<PerpsWithdrawPage />, createMockStore());

      await settleInitialWithdrawRoutesFetch();

      const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
      await user.clear(amountInput);
      await user.type(amountInput, '50');
      await user.click(screen.getByTestId('perps-withdraw-submit'));

      await awaitSubmitPromisesForMethod('perpsGetAccountState');
      await awaitSubmitPromisesForMethod('perpsWithdraw');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
      expect(mockTrack).not.toHaveBeenCalledWith(
        'Perp Withdrawal Transaction',
        expect.anything(),
      );

      await waitForWithdrawHandlerSettled();
    });

    it('fires only PerpsError when the withdrawal fails', async () => {
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
        if (method === 'perpsGetAccountState') {
          return Promise.resolve({ withdrawableBalance: '100' });
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

      await awaitSubmitPromisesForMethod('perpsGetAccountState');
      await awaitSubmitPromisesForMethod('perpsWithdraw');

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          'Perp Error',
          expect.objectContaining({
            [PERPS_EVENT_PROPERTY.ERROR_TYPE]: 'backend',
            [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: 'provider_error',
          }),
        );
      });
      expect(mockTrack).not.toHaveBeenCalledWith(
        'Perp Withdrawal Transaction',
        expect.anything(),
      );

      await waitForWithdrawHandlerSettled();
      await awaitSubmitPromisesForMethod('perpsClearWithdrawResult');
    });

    it('reports the prevented withdrawal when the fresh balance blocks it', async () => {
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
        if (method === 'perpsGetAccountState') {
          return Promise.resolve({ withdrawableBalance: '20' });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsWithdrawPage />, createMockStore());

      await settleInitialWithdrawRoutesFetch();

      const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
      await act(async () => {
        await user.clear(amountInput);
        await user.type(amountInput, '50');
        await user.click(screen.getByTestId('perps-withdraw-submit'));
      });

      await awaitSubmitPromisesForMethod('perpsGetAccountState');

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith('Perp Error', {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]: 'validation',
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: 'insufficient_balance',
          [PERPS_EVENT_PROPERTY.FAILURE_REASON]: 'stale_streamed_balance',
          [PERPS_EVENT_PROPERTY.SIZE]: '50',
          [PERPS_EXTENSION_EVENT_PROPERTY.STALE_BALANCE_SHORTFALL]: 80,
        });
      });

      await waitForBlockedWithdrawSettled();
    });

    it('reports the shortfall against the adopted balance, never negative', async () => {
      const user = userEvent.setup();
      let accountStateReads = 0;
      mockUsePerpsLiveAccount.mockReturnValue({
        // Stream pinned low, so a later read is what the block is decided on.
        account: makeAccountState({ spendableBalance: '10' }),
        isInitialLoading: false,
      });
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
        if (method === 'perpsGetAccountState') {
          accountStateReads += 1;
          return Promise.resolve({
            withdrawableBalance: accountStateReads === 1 ? '100' : '50',
          });
        }
        if (method === 'perpsWithdraw') {
          return Promise.resolve({ success: false, error: 'nope' });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsWithdrawPage />, createMockStore());

      await settleInitialWithdrawRoutesFetch();

      // First submit adopts the fresh $100; the withdrawal itself fails, so the
      // page stays put with $100 adopted over the streamed $10.
      const amountInput = screen.getByTestId('perps-fiat-hero-amount-input');
      await act(async () => {
        await user.clear(amountInput);
        await user.type(amountInput, '8');
        await user.click(screen.getByTestId('perps-withdraw-submit'));
      });
      await awaitSubmitPromisesForMethod('perpsGetAccountState');
      await awaitSubmitPromisesForMethod('perpsWithdraw');
      await waitForWithdrawHandlerSettled();
      await awaitSubmitPromisesForMethod('perpsClearWithdrawResult');

      expect(
        await screen.findByText(
          `${messages.perpsAvailableBalance.message}$100.00`,
        ),
      ).toBeInTheDocument();

      // Second submit is blocked by a $50 read. Measured against the streamed
      // $10 the reported shortfall would be -40.
      await act(async () => {
        await user.clear(amountInput);
        await user.type(amountInput, '60');
        await user.click(screen.getByTestId('perps-withdraw-submit'));
      });
      await awaitSubmitPromisesForMethod('perpsGetAccountState');

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith('Perp Error', {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]: 'validation',
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: 'insufficient_balance',
          [PERPS_EVENT_PROPERTY.FAILURE_REASON]: 'stale_streamed_balance',
          [PERPS_EVENT_PROPERTY.SIZE]: '60',
          [PERPS_EXTENSION_EVENT_PROPERTY.STALE_BALANCE_SHORTFALL]: 50,
        });
      });

      await waitForBlockedWithdrawSettled();
    });

    it('fires PerpsError when withdrawal throws an exception', async () => {
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
        if (method === 'perpsGetAccountState') {
          return Promise.resolve({ withdrawableBalance: '100' });
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

      await awaitSubmitPromisesForMethod('perpsGetAccountState');
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

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          'Perp Error',
          expect.objectContaining({
            [PERPS_EVENT_PROPERTY.ERROR_TYPE]: 'backend',
            [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: 'network',
          }),
        );
      });

      await waitForWithdrawHandlerSettled();
      await awaitSubmitPromisesForMethod('perpsClearWithdrawResult');
    });
  });
});
