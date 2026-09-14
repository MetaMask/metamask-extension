import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { mapKeys, omit, snakeCase } from 'lodash';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import type { I18NMessageDict } from '../../../shared/lib/i18n';
import { queryClient } from '../../contexts/query-client';
import { getEnLocaleMessages } from '../../ducks/locale/locale';
import { getMessage } from '../../helpers/utils/i18n-helper';
import {
  getMoneyPayChainIds,
  isMoneyDepositTx,
  isMoneyWithdrawTx,
} from '../../helpers/money/money-transaction-guards';
import {
  MoneyBottomSheetName,
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
  MoneySurfaceType,
  MoneyTooltipName,
  MoneyTooltipType,
  resolveMoneyRedirectTargetType,
  type MoneyRedirectTarget,
} from '../../pages/money/constants/money-events';
import { useAnalytics } from '../useAnalytics';
import { useI18nContext } from '../useI18nContext';
import { useMoneyAccountAvailability } from './use-money-account-availability';

const MONETIZED_PRIMITIVE_MONEY_ACCOUNT = 'money_account';

export type MoneyAnalyticsLocation = {
  screenName?: MoneyScreenName;
  bottomSheetName?: MoneyBottomSheetName;
  componentName?: MoneyComponentName;
};

type MoneyButtonClickedBase = {
  buttonIntent: MoneyButtonIntent;
  componentName?: MoneyComponentName;
  redirectTarget?: MoneyRedirectTarget;
  buttonPosition?: number;
  buttonRowButtonCount?: number;
};

export type MoneyButtonClickedProperties =
  | ({
      buttonType: MoneyButtonType.Text;
      labelKey: string;
    } & MoneyButtonClickedBase)
  | ({ buttonType: MoneyButtonType.Icon } & MoneyButtonClickedBase);

export type MoneySurfaceClickedProperties = {
  componentName?: MoneyComponentName;
  redirectTarget: MoneyRedirectTarget;
};

export type MoneyActivitySurfaceClickedProperties =
  MoneySurfaceClickedProperties & {
    transaction: TransactionMeta;
  };

export type MoneyTooltipClickedProperties = {
  tooltipName: MoneyTooltipName;
  tooltipType: MoneyTooltipType;
  componentName?: MoneyComponentName;
};

type WireValue = string | number | boolean | null | undefined;

const toWireProperties = (properties: Record<string, WireValue>) =>
  mapKeys(properties, (_value, key) => snakeCase(key));

const redirectTargetTypeOf = (
  redirectTarget: MoneyRedirectTarget | undefined,
) =>
  redirectTarget === undefined
    ? undefined
    : resolveMoneyRedirectTargetType(redirectTarget);

const asLabel = (message: unknown, fallback: string) =>
  typeof message === 'string' && message.length > 0 ? message : fallback;

export const useMoneyAnalytics = (location: MoneyAnalyticsLocation = {}) => {
  const { screenName, bottomSheetName, componentName } = location;
  const { trackEvent, createEventBuilder } = useAnalytics();
  const t = useI18nContext();
  const { availability } = useMoneyAccountAvailability();
  const moneyAccountAddress = availability.isAvailable
    ? availability.address
    : undefined;
  const enMessages = useSelector(getEnLocaleMessages) as
    | I18NMessageDict
    | undefined;

  const getBaseProperties = useCallback(() => {
    // Read from the shared cache at fire time rather than subscribing, so
    // consumers are not re-rendered by every background balance poll.
    const balanceQueryState =
      queryClient.getQueryState<CanonicalMoneyAccountBalanceResponse>([
        MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
        moneyAccountAddress ?? '',
      ]);

    const isBalanceFetching = balanceQueryState
      ? balanceQueryState.fetchStatus === 'fetching'
      : Boolean(moneyAccountAddress);

    const settledTotal =
      balanceQueryState?.status === 'success'
        ? (balanceQueryState.data?.totalBalance ?? '0')
        : undefined;

    const isMoneyBalanceLoading =
      isBalanceFetching && settledTotal === undefined;

    return {
      screenName,
      componentName,
      bottomSheetName,
      isMoneyBalanceLoading,
      isAccountFunded: isMoneyBalanceLoading
        ? null
        : new BigNumber(settledTotal ?? '0').gt(0),
    };
  }, [bottomSheetName, componentName, moneyAccountAddress, screenName]);

  const resolveLabel = useCallback(
    (labelKey: string) => ({
      labelEn: asLabel(getMessage('en', enMessages ?? {}, labelKey), labelKey),
      labelLocalized: asLabel(t(labelKey), labelKey),
    }),
    [enMessages, t],
  );

  const track = useCallback(
    (
      eventName: MetaMetricsEventName,
      properties: Record<string, WireValue>,
    ) => {
      trackEvent(
        createEventBuilder(eventName)
          .addCategory(MetaMetricsEventCategory.Money)
          .addProperties(
            toWireProperties({ ...getBaseProperties(), ...properties }),
          )
          .build(),
      );
    },
    [createEventBuilder, getBaseProperties, trackEvent],
  );

  const trackButtonClicked = useCallback(
    (properties: MoneyButtonClickedProperties) => {
      const label =
        properties.buttonType === MoneyButtonType.Text
          ? resolveLabel(properties.labelKey)
          : {};

      track(MetaMetricsEventName.MoneyButtonClicked, {
        ...omit(properties, 'labelKey'),
        ...label,
        redirectTargetType: redirectTargetTypeOf(properties.redirectTarget),
      });
    },
    [resolveLabel, track],
  );

  const trackSurfaceClicked = useCallback(
    (properties: MoneySurfaceClickedProperties) => {
      track(MetaMetricsEventName.MoneySurfaceClicked, {
        ...properties,
        redirectTargetType: redirectTargetTypeOf(properties.redirectTarget),
      });
    },
    [track],
  );

  const trackActivitySurfaceClicked = useCallback(
    ({ transaction, ...properties }: MoneyActivitySurfaceClickedProperties) => {
      const { sourceChainId, destinationChainId } =
        getMoneyPayChainIds(transaction);

      let transactionType = transaction.type;
      if (isMoneyDepositTx(transaction)) {
        transactionType = TransactionType.moneyAccountDeposit;
      } else if (isMoneyWithdrawTx(transaction)) {
        transactionType = TransactionType.moneyAccountWithdraw;
      }

      track(MetaMetricsEventName.MoneySurfaceClicked, {
        ...properties,
        redirectTargetType: redirectTargetTypeOf(properties.redirectTarget),
        transactionType: snakeCase(transactionType),
        transactionStatus: transaction.status,
        chainIdSource: sourceChainId,
        chainIdDestination: destinationChainId,
        monetizedPrimitive: MONETIZED_PRIMITIVE_MONEY_ACCOUNT,
      });
    },
    [track],
  );

  const trackTooltipClicked = useCallback(
    (properties: MoneyTooltipClickedProperties) => {
      track(MetaMetricsEventName.MoneyTooltipClicked, properties);
    },
    [track],
  );

  const trackSurfaceViewed = useCallback(
    (surfaceType: MoneySurfaceType) => {
      track(MetaMetricsEventName.MoneySurfaceViewed, { surfaceType });
    },
    [track],
  );

  const trackScreenViewed = useCallback(
    () => trackSurfaceViewed(MoneySurfaceType.Screen),
    [trackSurfaceViewed],
  );

  const trackBottomSheetViewed = useCallback(
    () => trackSurfaceViewed(MoneySurfaceType.BottomSheet),
    [trackSurfaceViewed],
  );

  const trackComponentViewed = useCallback(
    () => trackSurfaceViewed(MoneySurfaceType.Component),
    [trackSurfaceViewed],
  );

  return {
    trackButtonClicked,
    trackSurfaceClicked,
    trackActivitySurfaceClicked,
    trackTooltipClicked,
    trackScreenViewed,
    trackBottomSheetViewed,
    trackComponentViewed,
  };
};

export type MoneyAnalytics = ReturnType<typeof useMoneyAnalytics>;

export default useMoneyAnalytics;
