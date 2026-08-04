import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import type { UseMoneyAccountBalanceResult } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAccountInfo } from '../../../../hooks/money/useMoneyAccountInfo';
import type { UseMoneyAccountInfoResult } from '../../../../hooks/money/useMoneyAccountInfo';
import {
  MoneyAccountBalance,
  MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID,
  MONEY_ACCOUNT_BALANCE_TEST_ID,
  MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID,
} from './money-account-balance';

jest.mock('../../../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: jest.fn(),
}));

jest.mock('../../../../hooks/money/useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

const mockUseMoneyAccountBalance = jest.mocked(useMoneyAccountBalance);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);

const MONEY_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' as const;

type ArrangeOptions = {
  hasMoneyAccount?: boolean;
  totalFiatFormatted?: string;
  lastKnownTotalFiatFormatted?: string;
};

/**
 * Stubs the two hooks the component reads.
 *
 * Only the three fields the component consumes are stated; the rest of the
 * 19-field balance result is irrelevant here and a partial cast keeps the test
 * about the component rather than about the hook.
 *
 * @param options - What the hooks should report.
 * @param options.hasMoneyAccount - Whether a Money Account exists.
 * @param options.totalFiatFormatted - The live formatted balance, if any.
 * @param options.lastKnownTotalFiatFormatted - The last-known balance, if any.
 */
const arrange = ({
  hasMoneyAccount = true,
  totalFiatFormatted,
  lastKnownTotalFiatFormatted,
}: ArrangeOptions = {}) => {
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
  } as UseMoneyAccountBalanceResult);
};

const render = () =>
  renderWithProvider(<MoneyAccountBalance />, configureMockStore()(mockState));

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
    expect(getByText('Money balance')).toBeInTheDocument();
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID)).toBeNull();
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
    ).toHaveTextContent('Last known balance');
    expect(getByText('Last known balance')).toBeInTheDocument();
  });

  it('renders nothing when neither a live nor a last-known balance is available', () => {
    arrange();

    const { queryByTestId } = render();

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_TEST_ID)).toBeNull();
  });
});
