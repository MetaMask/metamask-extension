import React from 'react';
import BigNumber from 'bignumber.js';
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
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../../../hooks/money/useMoneyAnalytics.mock';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../../../pages/money/constants/money-events';
import {
  MoneyAccountBalance,
  MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID,
  MONEY_ACCOUNT_BALANCE_APY_SKELETON_TEST_ID,
  MONEY_ACCOUNT_BALANCE_APY_TEST_ID,
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

const mockMoneyAnalytics = createMoneyAnalyticsMock();
jest.mock('../../../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

const mockUseMoneyAccountBalance = jest.mocked(useMoneyAccountBalance);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);
const mockUseMoneyAccountDeposit = jest.mocked(useMoneyAccountDeposit);
const mockInitiateDeposit = jest.fn();

const MONEY_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' as const;

type ArrangeOptions = {
  hasMoneyAccount?: boolean;
  tokenTotal?: BigNumber;
  totalFiatFormatted?: string;
  lastKnownTotalFiatFormatted?: string;
  isBalanceLoading?: boolean;
  isDepositLoading?: boolean;
  apyPercentFormatted?: string;
  isVaultApyLoading?: boolean;
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
 * @param options.tokenTotal - The live balance as a BigNumber, if any.
 * @param options.totalFiatFormatted - The live formatted balance, if any.
 * @param options.lastKnownTotalFiatFormatted - The last-known balance, if any.
 * @param options.isBalanceLoading - Whether the balance fetch is in flight.
 * @param options.isDepositLoading - Whether a deposit initiation is in flight.
 * @param options.apyPercentFormatted - The formatted vault APY, if any.
 * @param options.isVaultApyLoading - Whether the vault APY fetch is in flight.
 */
const arrange = ({
  hasMoneyAccount = true,
  tokenTotal,
  totalFiatFormatted,
  lastKnownTotalFiatFormatted,
  isBalanceLoading = false,
  isDepositLoading = false,
  apyPercentFormatted,
  isVaultApyLoading = false,
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
    tokenTotal,
    totalFiatFormatted,
    lastKnownTotalFiatFormatted,
    isBalanceLoading,
    apyPercentFormatted,
    vaultApyQuery: { isLoading: isVaultApyLoading },
  } as UseMoneyAccountBalanceResult);
};

const render = ({ privacyMode = false, isHomeCardEnabled = true } = {}) =>
  renderWithProvider(
    <MoneyAccountBalance />,
    configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: { ...mockState.metamask.preferences, privacyMode },
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          moneyHomeScreenCardEnabled: {
            enabled: isHomeCardEnabled,
            minimumVersion: '0.0.0',
          },
        },
      },
    }),
  );

describe('MoneyAccountBalance', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
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

  it('renders nothing when the home screen card flag is off', () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { queryByTestId } = render({ isHomeCardEnabled: false });

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_TEST_ID)).toBeNull();
  });

  it('renders the live balance when one is available', () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { getByTestId, getByText, queryByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toHaveTextContent(
      '$2,384.34',
    );
    expect(getByText(tEn('money'))).toBeInTheDocument();
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID)).toBeNull();
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID)).toBeNull();
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

  it('shows the info copy when the title is hovered', async () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { getByTestId, getByText, queryByText } = render();

    expect(queryByText(/Your dollar-backed mUSD balance/u)).toBeNull();

    await act(async () => {
      fireEvent.mouseEnter(
        getByTestId(`${MONEY_ACCOUNT_BALANCE_INFO_TEST_ID}-trigger`),
      );
    });

    expect(getByText(tEn('moneyBalanceInfoBody'))).toBeInTheDocument();
    expect(getByText(tEn('moneyBalanceInfoWithdrawals'))).toBeInTheDocument();
    expect(getByText(tEn('moneyBalanceInfoBody'))).toHaveClass('text-default');
    expect(getByText(tEn('moneyBalanceInfoWithdrawals'))).toHaveClass(
      'text-default',
    );
    expect(mockMoneyAnalytics.trackTooltipClicked).toHaveBeenCalledWith({
      tooltipName: MoneyTooltipName.MoneyBalance,
      tooltipType: MoneyTooltipType.Info,
    });
  });

  it('shows Add instead of the figure when the live balance is zero', () => {
    arrange({ tokenTotal: new BigNumber(0), totalFiatFormatted: '$0.00' });

    const { getByTestId, queryByTestId } = render();

    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID),
    ).toHaveTextContent(tEn('moneyAdd'));
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toBeNull();
  });

  it('shows Add instead of $0.00 when the live balance is sub-cent dust', () => {
    arrange({
      tokenTotal: new BigNumber('0.004'),
      totalFiatFormatted: '$0.00',
    });

    const { getByTestId, queryByTestId } = render();

    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID),
    ).toHaveTextContent(tEn('moneyAdd'));
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toBeNull();
  });

  it('shows the figure rather than Add once the live balance reaches one cent', () => {
    arrange({
      tokenTotal: new BigNumber('0.01'),
      totalFiatFormatted: '$0.01',
    });

    const { getByTestId, queryByTestId } = render();

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID)).toBeNull();
    expect(getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toHaveTextContent(
      '$0.01',
    );
  });

  it('keeps the masked figure rather than Add when privacy mode hides a zero balance', () => {
    arrange({ tokenTotal: new BigNumber(0), totalFiatFormatted: '$0.00' });

    const { getByTestId, queryByTestId } = render({ privacyMode: true });

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID)).toBeNull();
    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID),
    ).not.toHaveTextContent('$0.00');
  });

  it('keeps the last-known label rather than Add when the stale figure is zero', () => {
    arrange({ lastKnownTotalFiatFormatted: '$0.00' });

    const { getByTestId, queryByTestId } = render();

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID)).toBeNull();
    expect(getByTestId(MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID)).toHaveTextContent(
      '$0.00',
    );
    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID),
    ).toBeInTheDocument();
  });

  it('initiates a generic deposit when Add is clicked', () => {
    // No intent: consumers derive it from the transaction's actual payment
    // method, exactly as mobile's MoneyBalanceCard does.
    arrange({ tokenTotal: new BigNumber(0), totalFiatFormatted: '$0.00' });

    const { getByTestId } = render();

    fireEvent.click(getByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID));

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
    expect(mockInitiateDeposit).toHaveBeenCalledWith();
    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      screenName: MoneyScreenName.WalletHome,
      componentName: MoneyComponentName.BalanceCard,
    });
    expect(mockMoneyAnalytics.trackButtonClicked).toHaveBeenCalledWith({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      labelKey: 'moneyAdd',
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
  });

  it('tracks the component as viewed once when it renders', () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { rerender } = render();
    rerender(<MoneyAccountBalance />);

    expect(mockMoneyAnalytics.trackComponentViewed).toHaveBeenCalledTimes(1);
  });

  it('tracks the view only once the component first renders', () => {
    arrange({ hasMoneyAccount: false });

    const { rerender } = render();
    expect(mockMoneyAnalytics.trackComponentViewed).not.toHaveBeenCalled();

    arrange({ totalFiatFormatted: '$2,384.34' });
    rerender(<MoneyAccountBalance />);
    arrange({ hasMoneyAccount: false });
    rerender(<MoneyAccountBalance />);
    arrange({ totalFiatFormatted: '$2,384.34' });
    rerender(<MoneyAccountBalance />);

    expect(mockMoneyAnalytics.trackComponentViewed).toHaveBeenCalledTimes(1);
  });

  it('disables the Add button while a deposit is being initiated', () => {
    arrange({
      tokenTotal: new BigNumber(0),
      totalFiatFormatted: '$0.00',
      isDepositLoading: true,
    });

    const { getByTestId } = render();

    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID),
    ).toBeDisabled();
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

  it('renders the vault APY from the balance hook', () => {
    arrange({
      totalFiatFormatted: '$2,384.34',
      apyPercentFormatted: '4.2%',
    });

    const { getByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_APY_TEST_ID)).toHaveTextContent(
      tEn('moneyApy', ['4.2%']),
    );
  });

  it('shows a skeleton while the vault APY is loading with nothing to show', () => {
    arrange({
      totalFiatFormatted: '$2,384.34',
      isVaultApyLoading: true,
    });

    const { getByTestId, queryByTestId } = render();

    expect(
      getByTestId(MONEY_ACCOUNT_BALANCE_APY_SKELETON_TEST_ID),
    ).toBeInTheDocument();
    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_APY_TEST_ID)).toBeNull();
  });

  it('shows a configured APY while the vault APY query is loading', () => {
    arrange({
      totalFiatFormatted: '$2,384.34',
      apyPercentFormatted: '5%',
      isVaultApyLoading: true,
    });

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId(MONEY_ACCOUNT_BALANCE_APY_TEST_ID)).toHaveTextContent(
      tEn('moneyApy', ['5%']),
    );
    expect(
      queryByTestId(MONEY_ACCOUNT_BALANCE_APY_SKELETON_TEST_ID),
    ).toBeNull();
  });

  it('omits the APY when none is available', () => {
    arrange({ totalFiatFormatted: '$2,384.34' });

    const { queryByTestId } = render();

    expect(queryByTestId(MONEY_ACCOUNT_BALANCE_APY_TEST_ID)).toBeNull();
    expect(
      queryByTestId(MONEY_ACCOUNT_BALANCE_APY_SKELETON_TEST_ID),
    ).toBeNull();
  });
});
