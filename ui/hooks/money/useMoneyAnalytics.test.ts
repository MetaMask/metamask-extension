/* eslint-disable @typescript-eslint/naming-convention -- Money event properties use snake_case to match mobile */
import { renderHook } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { QueryState } from '@tanstack/react-query';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { I18nProvider } from '../../contexts/i18n';
import { queryClient } from '../../contexts/query-client';
import {
  MONEY_URLS,
  MoneyBottomSheetName,
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyRedirectTargetType,
  MoneyScreenName,
  MoneySurfaceType,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../pages/money/constants/money-events';
import { useMoneyAccountAvailability } from './use-money-account-availability';
import {
  useMoneyAnalytics,
  type MoneyAnalyticsLocation,
} from './useMoneyAnalytics';

const mockTrackEvent = jest.fn();

jest.mock('../useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({ trackEvent: mockTrackEvent, createEventBuilder }),
  };
});

const mockState = {
  localeMessages: {
    currentLocale: 'fr',
    current: {
      moneyAdd: { message: 'Ajouter' },
    },
    en: {
      moneyAdd: { message: 'Add' },
      money: { message: 'Money' },
      moneyLearnMore: { message: 'Learn more' },
    },
  },
};

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));

jest.mock('./use-money-account-availability', () => ({
  useMoneyAccountAvailability: jest.fn(),
}));

jest.mock('../../contexts/query-client', () => ({
  queryClient: { getQueryState: jest.fn() },
}));

const MONEY_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

const mockUseMoneyAccountAvailability = jest.mocked(
  useMoneyAccountAvailability,
);
const mockGetQueryState = jest.mocked(queryClient.getQueryState);

type BalanceState = Partial<QueryState<{ totalBalance: string }>>;

function arrangeBalance(state: BalanceState | undefined) {
  mockGetQueryState.mockReturnValue(
    state as ReturnType<typeof queryClient.getQueryState>,
  );
}

function arrangeMoneyAccount(address: string | undefined) {
  mockUseMoneyAccountAvailability.mockReturnValue({
    availability: address
      ? { isAvailable: true, address }
      : { isAvailable: false },
  } as unknown as ReturnType<typeof useMoneyAccountAvailability>);
}

function renderAnalytics(location?: MoneyAnalyticsLocation) {
  return renderHook(() => useMoneyAnalytics(location), {
    wrapper: I18nProvider,
  }).result.current;
}

const FUNDED_BASE = {
  category: MetaMetricsEventCategory.Money,
  is_money_balance_loading: false,
  is_account_funded: true,
};

function expectEvent(
  name: MetaMetricsEventName,
  properties: Record<string, unknown>,
) {
  expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  expect(mockTrackEvent.mock.calls[0][0]).toStrictEqual({
    name,
    properties,
    sensitiveProperties: {},
  });
}

describe('useMoneyAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    arrangeMoneyAccount(MONEY_ADDRESS);
    arrangeBalance({
      status: 'success',
      fetchStatus: 'idle',
      data: { totalBalance: '3000000' },
    });
  });

  describe('base properties', () => {
    it('reads the balance from the query cache under the money account address', () => {
      renderAnalytics({
        screenName: MoneyScreenName.MoneyHome,
      }).trackScreenViewed();

      expect(mockGetQueryState).toHaveBeenCalledWith([
        MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
        MONEY_ADDRESS,
      ]);
      expectEvent(MetaMetricsEventName.MoneySurfaceViewed, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.MoneyHome,
        surface_type: MoneySurfaceType.Screen,
      });
    });

    it('includes every supplied location property', () => {
      renderAnalytics({
        screenName: MoneyScreenName.WalletHome,
        componentName: MoneyComponentName.BalanceCard,
        bottomSheetName: MoneyBottomSheetName.MoreSheet,
      }).trackComponentViewed();

      expectEvent(MetaMetricsEventName.MoneySurfaceViewed, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.WalletHome,
        component_name: MoneyComponentName.BalanceCard,
        bottom_sheet_name: MoneyBottomSheetName.MoreSheet,
        surface_type: MoneySurfaceType.Component,
      });
    });

    it('omits location properties that were not supplied', () => {
      renderAnalytics().trackScreenViewed();

      expectEvent(MetaMetricsEventName.MoneySurfaceViewed, {
        ...FUNDED_BASE,
        surface_type: MoneySurfaceType.Screen,
      });
    });

    it('reports an unfunded account for a zero balance', () => {
      arrangeBalance({
        status: 'success',
        fetchStatus: 'idle',
        data: { totalBalance: '0' },
      });

      renderAnalytics().trackScreenViewed();

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        is_money_balance_loading: false,
        is_account_funded: false,
      });
    });

    it('reports loading with an unknown funded state during the first fetch', () => {
      arrangeBalance({ status: 'pending', fetchStatus: 'fetching' });

      renderAnalytics().trackScreenViewed();

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        is_money_balance_loading: true,
        is_account_funded: null,
      });
    });

    it('treats a missing cache entry as loading when a money account exists', () => {
      arrangeBalance(undefined);

      renderAnalytics().trackScreenViewed();

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        is_money_balance_loading: true,
        is_account_funded: null,
      });
    });

    it('treats a missing cache entry as unfunded when there is no money account', () => {
      arrangeMoneyAccount(undefined);
      arrangeBalance(undefined);

      renderAnalytics().trackScreenViewed();

      expect(mockGetQueryState).toHaveBeenCalledWith([
        MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
        '',
      ]);
      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        is_money_balance_loading: false,
        is_account_funded: false,
      });
    });

    it('does not report funded from a failed fetch', () => {
      arrangeBalance({ status: 'error', fetchStatus: 'idle' });

      renderAnalytics().trackScreenViewed();

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        is_money_balance_loading: false,
        is_account_funded: false,
      });
    });
  });

  describe('trackButtonClicked', () => {
    it('resolves a label key into English and localized labels', () => {
      renderAnalytics({
        screenName: MoneyScreenName.MoneyHome,
      }).trackButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        labelKey: 'moneyAdd',
        componentName: MoneyComponentName.ActionButtonRow,
        redirectTarget: MoneyScreenName.MoneyDeposit,
        buttonPosition: 1,
        buttonRowButtonCount: 2,
      });

      expectEvent(MetaMetricsEventName.MoneyButtonClicked, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.MoneyHome,
        button_type: MoneyButtonType.Text,
        button_intent: MoneyButtonIntent.AddMoney,
        component_name: MoneyComponentName.ActionButtonRow,
        label_en: 'Add',
        label_localized: 'Ajouter',
        redirect_target: MoneyScreenName.MoneyDeposit,
        redirect_target_type: MoneyRedirectTargetType.Screen,
        button_position: 1,
        button_row_button_count: 2,
      });
    });

    it('keeps the location component when the call does not name one', () => {
      renderAnalytics({
        screenName: MoneyScreenName.WalletHome,
        componentName: MoneyComponentName.BalanceCard,
      }).trackButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        labelKey: 'moneyAdd',
        redirectTarget: MoneyScreenName.MoneyDeposit,
      });

      expectEvent(MetaMetricsEventName.MoneyButtonClicked, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.WalletHome,
        component_name: MoneyComponentName.BalanceCard,
        button_type: MoneyButtonType.Text,
        button_intent: MoneyButtonIntent.AddMoney,
        label_en: 'Add',
        label_localized: 'Ajouter',
        redirect_target: MoneyScreenName.MoneyDeposit,
        redirect_target_type: MoneyRedirectTargetType.Screen,
      });
    });

    it('falls back to the English label when the locale has no translation', () => {
      renderAnalytics().trackButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.GoToMoneyHome,
        labelKey: 'money',
      });

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        label_en: 'Money',
        label_localized: 'Money',
      });
    });

    it('omits labels and unset properties for icon buttons', () => {
      renderAnalytics({
        screenName: MoneyScreenName.MoneyHome,
      }).trackButtonClicked({
        buttonType: MoneyButtonType.Icon,
        buttonIntent: MoneyButtonIntent.OpenMoreMenu,
        componentName: MoneyComponentName.More,
        redirectTarget: MoneyBottomSheetName.MoreSheet,
      });

      expectEvent(MetaMetricsEventName.MoneyButtonClicked, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.MoneyHome,
        button_type: MoneyButtonType.Icon,
        button_intent: MoneyButtonIntent.OpenMoreMenu,
        component_name: MoneyComponentName.More,
        redirect_target: MoneyBottomSheetName.MoreSheet,
        redirect_target_type: MoneyRedirectTargetType.BottomSheet,
      });
    });

    it('classifies URL redirect targets as external browser', () => {
      renderAnalytics().trackButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.LearnMore,
        labelKey: 'moneyLearnMore',
        redirectTarget: MONEY_URLS.MONEY_LANDING,
      });

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        redirect_target: MONEY_URLS.MONEY_LANDING,
        redirect_target_type: MoneyRedirectTargetType.ExternalBrowser,
      });
    });
  });

  describe('trackTokenButtonClicked', () => {
    it('tracks a button click with token row properties', () => {
      renderAnalytics({
        screenName: MoneyScreenName.MoneyHome,
      }).trackTokenButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        labelKey: 'moneyAdd',
        componentName: MoneyComponentName.PotentialEarningsSectionTokenRow,
        redirectTarget: MoneyScreenName.MoneyDeposit,
        tokenSymbol: 'USDC',
        tokenChainId: '0x1',
        tokenPositionInList: 2,
        tokensInList: 5,
        tokenHasBalance: true,
      });

      expectEvent(MetaMetricsEventName.MoneyButtonClicked, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.MoneyHome,
        button_type: MoneyButtonType.Text,
        button_intent: MoneyButtonIntent.AddMoney,
        component_name: MoneyComponentName.PotentialEarningsSectionTokenRow,
        label_en: 'Add',
        label_localized: 'Ajouter',
        redirect_target: MoneyScreenName.MoneyDeposit,
        redirect_target_type: MoneyRedirectTargetType.Screen,
        token_symbol: 'USDC',
        token_chain_id: '0x1',
        token_position_in_list: 2,
        tokens_in_list: 5,
        token_has_balance: true,
      });
    });
  });

  describe('trackSurfaceClicked', () => {
    it('tracks the component and derived redirect type', () => {
      renderAnalytics({
        bottomSheetName: MoneyBottomSheetName.TransferMoneySheet,
      }).trackSurfaceClicked({
        componentName: MoneyComponentName.TransferMoneySheetBetweenAccounts,
        redirectTarget: MoneyScreenName.MoneyTransfer,
      });

      expectEvent(MetaMetricsEventName.MoneySurfaceClicked, {
        ...FUNDED_BASE,
        bottom_sheet_name: MoneyBottomSheetName.TransferMoneySheet,
        component_name: MoneyComponentName.TransferMoneySheetBetweenAccounts,
        redirect_target: MoneyScreenName.MoneyTransfer,
        redirect_target_type: MoneyRedirectTargetType.Screen,
      });
    });

    it('keeps the location component when the call does not name one', () => {
      renderAnalytics({
        componentName: MoneyComponentName.BalanceCard,
      }).trackSurfaceClicked({
        redirectTarget: MoneyScreenName.MoneyHome,
      });

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        component_name: MoneyComponentName.BalanceCard,
      });
    });
  });

  describe('trackActivitySurfaceClicked', () => {
    const baseTx = {
      id: 'tx-1',
      chainId: CHAIN_IDS.MONAD,
      status: TransactionStatus.confirmed,
      txParams: {},
    } as unknown as TransactionMeta;

    it('flattens a nested deposit into money transaction properties', () => {
      renderAnalytics({
        screenName: MoneyScreenName.MoneyActivity,
      }).trackActivitySurfaceClicked({
        transaction: {
          ...baseTx,
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
          metamaskPay: { chainId: CHAIN_IDS.ARBITRUM },
        } as unknown as TransactionMeta,
        componentName: MoneyComponentName.ActivityListItem,
        redirectTarget: MoneyScreenName.MoneyActivityDetails,
      });

      expectEvent(MetaMetricsEventName.MoneySurfaceClicked, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.MoneyActivity,
        component_name: MoneyComponentName.ActivityListItem,
        redirect_target: MoneyScreenName.MoneyActivityDetails,
        redirect_target_type: MoneyRedirectTargetType.Screen,
        transaction_type: 'money_account_deposit',
        transaction_status: TransactionStatus.confirmed,
        chain_id_source: CHAIN_IDS.ARBITRUM,
        chain_id_destination: CHAIN_IDS.MONAD,
        monetized_primitive: 'money_account',
      });
    });

    it('flips the chain ids for a post-quote withdrawal', () => {
      renderAnalytics().trackActivitySurfaceClicked({
        transaction: {
          ...baseTx,
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.moneyAccountWithdraw }],
          metamaskPay: { chainId: CHAIN_IDS.ARBITRUM, isPostQuote: true },
        } as unknown as TransactionMeta,
        redirectTarget: MoneyScreenName.MoneyActivityDetails,
      });

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        transaction_type: 'money_account_withdraw',
        chain_id_source: CHAIN_IDS.MONAD,
        chain_id_destination: CHAIN_IDS.ARBITRUM,
      });
    });

    it('uses the local chain for both sides without MetaMask Pay', () => {
      renderAnalytics().trackActivitySurfaceClicked({
        transaction: {
          ...baseTx,
          type: TransactionType.moneyAccountWithdraw,
        } as TransactionMeta,
        redirectTarget: MoneyScreenName.MoneyActivityDetails,
      });

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        transaction_type: 'money_account_withdraw',
        chain_id_source: CHAIN_IDS.MONAD,
        chain_id_destination: CHAIN_IDS.MONAD,
      });
    });

    it('keeps the raw type for other money account transactions', () => {
      renderAnalytics().trackActivitySurfaceClicked({
        transaction: {
          ...baseTx,
          type: TransactionType.perpsDeposit,
        } as TransactionMeta,
        redirectTarget: MoneyScreenName.MoneyActivityDetails,
      });

      expect(mockTrackEvent.mock.calls[0][0].properties).toMatchObject({
        transaction_type: 'perps_deposit',
      });
    });
  });

  describe('trackTooltipClicked', () => {
    it('tracks the tooltip name, type, and component', () => {
      renderAnalytics({
        screenName: MoneyScreenName.MoneyDeposit,
      }).trackTooltipClicked({
        tooltipName: MoneyTooltipName.Apy,
        tooltipType: MoneyTooltipType.Info,
        componentName: MoneyComponentName.BalanceProjection,
      });

      expectEvent(MetaMetricsEventName.MoneyTooltipClicked, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.MoneyDeposit,
        tooltip_name: MoneyTooltipName.Apy,
        tooltip_type: MoneyTooltipType.Info,
        component_name: MoneyComponentName.BalanceProjection,
      });
    });

    it('keeps the location component when the call does not name one', () => {
      renderAnalytics({
        screenName: MoneyScreenName.WalletHome,
        componentName: MoneyComponentName.BalanceCard,
      }).trackTooltipClicked({
        tooltipName: MoneyTooltipName.MoneyBalance,
        tooltipType: MoneyTooltipType.Info,
      });

      expectEvent(MetaMetricsEventName.MoneyTooltipClicked, {
        ...FUNDED_BASE,
        screen_name: MoneyScreenName.WalletHome,
        component_name: MoneyComponentName.BalanceCard,
        tooltip_name: MoneyTooltipName.MoneyBalance,
        tooltip_type: MoneyTooltipType.Info,
      });
    });
  });

  describe('view events', () => {
    const cases: [
      'trackScreenViewed' | 'trackBottomSheetViewed' | 'trackComponentViewed',
      MoneySurfaceType,
    ][] = [
      ['trackScreenViewed', MoneySurfaceType.Screen],
      ['trackBottomSheetViewed', MoneySurfaceType.BottomSheet],
      ['trackComponentViewed', MoneySurfaceType.Component],
    ];

    cases.forEach(([method, surfaceType]) => {
      it(`${method} reports surface_type ${surfaceType}`, () => {
        renderAnalytics()[method]();

        expectEvent(MetaMetricsEventName.MoneySurfaceViewed, {
          ...FUNDED_BASE,
          surface_type: surfaceType,
        });
      });
    });
  });
});
