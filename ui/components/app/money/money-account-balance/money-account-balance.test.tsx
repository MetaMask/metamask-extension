import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import type { UseMoneyAccountBalanceResult } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAccountDeposit } from '../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../../hooks/money/useMoneyAccountInfo';
import type { UseMoneyAccountInfoResult } from '../../../../hooks/money/useMoneyAccountInfo';
import {
  MoneyAccountBalance,
  MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID,
  MONEY_ACCOUNT_BALANCE_INFO_TEST_ID,
  MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID,
  MONEY_ACCOUNT_BALANCE_SKELETON_TEST_ID,
  MONEY_ACCOUNT_BALANCE_TEST_ID,
  MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID,
} from './money-account-balance';

jest.mock('../../../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: jest.fn(),
}));

jest.mock('../../../../hooks/money/useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

jest.mock('../../../../hooks/money/useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: jest.fn(),
}));

const mockUseMoneyAccountBalance = jest.mocked(useMoneyAccountBalance);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);
const mockUseMoneyAccountDeposit = jest.mocked(useMoneyAccountDeposit);
const mockInitiateDeposit = jest.fn();

const MONEY_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' as const;

type ArrangeOptions = {
  hasMoneyAccount?: boolean;
  totalFiatFormatted?: string;
  lastKnownTotalFiatFormatted?: string;
  isBalanceLoading?: boolean;
  isDepositLoading?: boolean;
};

/**
 * Stubs the three hooks the component reads.
 *
 * Only the fields the component consumes are stated; the rest of the
 * 19-field balance result is irrelevant here and a partial cast keeps the test
 * about the component rather than about the hook.
 *
 * @param options - What the hooks should report.
 * @param options.hasMoneyAccount - Whether a Money Account exists.
 * @param options.totalFiatFormatted - The live formatted balance, if any.
 * @param options.lastKnownTotalFiatFormatted - The last-known balance, if any.
 * @param options.isBalanceLoading - Whether the balance fetch is in flight.
 * @param options.isDepositLoading - Whether a deposit initiation is in flight.
 */
const arrange = ({
  hasMoneyAccount = true,
  totalFiatFormatted,
  lastKnownTotalFiatFormatted,
  isBalanceLoading = false,
  isDepositLoading = false,
}: ArrangeOptions = {}) => {
  mockInitiateDeposit.mockResolvedValue(undefined);
  mockUseMoneyAccountDeposit.mockReturnValue({
    initiateDeposit: mockInitiateDeposit,
    isLoading: isDepositLoading,
  });

  mockUseMoneyAccountInfo.mockReturnValue({
    isMoneyAccountFeatureEnabled: hasMoneyAccount,
    hasMoneyAccount,
    primaryMoneyAccount: hasMoneyAccount
      ? { address: MONEY_ADDRESS }
      : undefined,
  } satisfies UseMoneyAccountInfoResult);

  mockUseMoneyAccountBalance.mockReturnValue({
    totalFiatFormatted,
    lastKnownTotalFiatFormatted,
    isBalanceLoading,
  } as UseMoneyAccountBalanceResult);
};

const render = ({ privacyMode = false } = {}) =>
  renderWithProvider(
    <MoneyAccountBalance />,
    configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: { ...mockState.metamask.preferences, privacyMode },
      },
    }),
  );

describe('MoneyAccountBalance', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing when there is no money account', () => {
    // A last-known figure is deliberately present: with no account there is
    // nothing to attribute it to, so it must not be shown either.
    arrange({
      hasMoneyAccount: false,
      lastKnownTotalFiatFormatted: '$1,234.56',
    });

    const { queryByTestId } = render();

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_TEST_ID)).toBeNull();
  });

  it('renders the live balance when one is available', () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { getByTestId, getByText, queryByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toHaveTextContent(
      '$2,384.34',
    );
    expect(getByText(tEn('moneyBalanceTitle'))).toBeInTheDocument();
    expect(getByText('• mUSD')).toBeInTheDocument();
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID)).toBeNull();
  });

  it('hides the balance when privacy mode is on', () => {
    // Every other balance on the account overview honours this setting; without
    // it, turning balances off would leave the Money row as the one figure
    // still on screen.
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { getByTestId } = render({ privacyMode: true });

    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID),
    ).not.toHaveTextContent('$2,384.34');
  });

  it('prefers the live balance over the last-known one', () => {
    arrange({
      totalFiatFormatted: '$2,384.34',
      lastKnownTotalFiatFormatted: '$1,234.56',
    });

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toHaveTextContent(
      '$2,384.34',
    );
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID)).toBeNull();
  });

  it('labels the last-known balance as such when the live balance is unavailable', () => {
    arrange({ lastKnownTotalFiatFormatted: '$1,234.56' });

    const { getByTestId, getByText } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toHaveTextContent(
      '$1,234.56',
    );
    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID),
    ).toHaveTextContent(tEn('moneyBalanceLastKnown'));
    expect(getByText(tEn('moneyBalanceLastKnown'))).toBeInTheDocument();
  });

  it('renders nothing when neither a live nor a last-known balance is available', () => {
    arrange();

    const { queryByTestId } = render();

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_TEST_ID)).toBeNull();
  });

  it('shows a skeleton while the balance is loading with nothing to show', () => {
    arrange({ isBalanceLoading: true });

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_TEST_ID)).toBeInTheDocument();
    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_SKELETON_TEST_ID),
    ).toBeInTheDocument();
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toBeNull();
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID)).toBeNull();
  });

  it('shows the info copy when the info icon is clicked', async () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { getByTestId, getByText, queryByText } = render();

    expect(queryByText(/Your dollar-backed mUSD balance/u)).toBeNull();

    await act(async () => {
      fireEvent.click(
        getByTestId(`${MONEY_ACCOUNT_BALANCE_INFO_TEST_ID}-button`),
      );
    });

    expect(getByText(tEn('moneyBalanceInfoBody'))).toBeInTheDocument();
    expect(getByText(tEn('moneyBalanceInfoWithdrawals'))).toBeInTheDocument();
  });

  it('initiates a deposit with the addMusd intent when Add is clicked', () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { getByTestId } = render();

    fireEvent.click(getByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID));

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
    expect(mockInitiateDeposit).toHaveBeenCalledWith({ intent: 'addMusd' });
  });

  it('disables the Add button while a deposit is being initiated', () => {
    arrange({ totalFiatFormatted: '$2,384.34', isDepositLoading: true });

    const { getByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID)).toBeDisabled();
  });

  it('prefers the last-known balance over the skeleton while loading', () => {
    arrange({
      isBalanceLoading: true,
      lastKnownTotalFiatFormatted: '$1,234.56',
    });

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toHaveTextContent(
      '$1,234.56',
    );
    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID),
    ).toHaveTextContent(tEn('moneyBalanceLastKnown'));
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_SKELETON_TEST_ID)).toBeNull();
  });
});
