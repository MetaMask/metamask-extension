import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { PERPS_SUPPORT_ARTICLES_URLS } from '../../../../../shared/constants/perps';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import { isEqualCaseInsensitive } from '../../../../../shared/lib/string-utils';
import { FillType } from '../types/transactionHistory';
import type { PerpsTransaction } from '../types';

type FillTagConfig = {
  label: string;
  textColor: TextColor;
  bgClass: string;
  borderClass: string;
  testId: string;
  condition?: boolean;
};

export type PerpsFillTagProps = {
  transaction: PerpsTransaction;
  screenName?: string;
};

/**
 * Displays forced trade pills (Take Profit, Stop Loss, Liquidation, ADL)
 * for perps transactions based on their fill type.
 * Adapted from mobile PerpsFillTag component.
 *
 * @param options0 - Component props
 * @param options0.transaction - The perps transaction to render a fill tag for
 * @param options0.screenName - Optional screen name for analytics tracking
 */
export const PerpsFillTag: React.FC<PerpsFillTagProps> = ({
  transaction,
  screenName = PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_ACTIVITY_HISTORY,
}) => {
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { track } = usePerpsEventTracking();

  const handleAdlClick = useCallback(() => {
    globalThis.platform.openTab({
      url: PERPS_SUPPORT_ARTICLES_URLS.AdlUrl,
    });
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
      [PERPS_EVENT_PROPERTY.SCREEN_NAME]: screenName,
      [PERPS_EVENT_PROPERTY.TAB_NAME]:
        PERPS_EVENT_VALUE.PERPS_HISTORY_TABS.TRADES,
      [PERPS_EVENT_PROPERTY.ACTION_TYPE]:
        PERPS_EVENT_VALUE.ACTION_TYPE.ADL_LEARN_MORE,
      [PERPS_EVENT_PROPERTY.ASSET]: transaction.symbol,
      [PERPS_EVENT_PROPERTY.ORDER_TIMESTAMP]: transaction.timestamp,
    });
  }, [track, screenName, transaction.symbol, transaction.timestamp]);

  const tagConfig = useMemo((): FillTagConfig | null => {
    const { fill } = transaction;

    if (!fill || fill.fillType === FillType.Standard) {
      return null;
    }

    const configLookup: Partial<Record<FillType, FillTagConfig>> = {
      [FillType.AutoDeleveraging]: {
        label: t('perpsAutoDeleveraging'),
        textColor: TextColor.InfoDefault,
        bgClass: 'bg-info-muted',
        borderClass: '',
        testId: 'perps-fill-tag-adl',
      },
      [FillType.Liquidation]: {
        condition:
          Boolean(fill.liquidation?.liquidatedUser) &&
          Boolean(selectedAccount?.address) &&
          isEqualCaseInsensitive(
            fill.liquidation?.liquidatedUser ?? '',
            selectedAccount?.address ?? '',
          ),
        label: t('perpsLiquidated'),
        textColor: TextColor.ErrorDefault,
        bgClass: 'bg-error-muted',
        borderClass: '',
        testId: 'perps-fill-tag-liquidated',
      },
      [FillType.TakeProfit]: {
        label: t('perpsTakeProfit'),
        textColor: TextColor.TextAlternative,
        bgClass: 'bg-default',
        borderClass: 'border border-muted',
        testId: 'perps-fill-tag-take-profit',
      },
      [FillType.StopLoss]: {
        label: t('perpsStopLoss'),
        textColor: TextColor.TextAlternative,
        bgClass: 'bg-default',
        borderClass: 'border border-muted',
        testId: 'perps-fill-tag-stop-loss',
      },
    };

    const config = configLookup[fill.fillType];

    if (!config || ('condition' in config && config.condition === false)) {
      return null;
    }

    return config;
  }, [transaction, selectedAccount?.address, t]);

  if (!tagConfig) {
    return null;
  }

  const pill = (
    <Box
      alignItems={BoxAlignItems.Center}
      className={`rounded-full px-2 py-0.5 ${tagConfig.bgClass} ${tagConfig.borderClass}`}
      data-testid={tagConfig.testId}
    >
      <Text
        variant={TextVariant.BodyXs}
        fontWeight={FontWeight.Medium}
        color={tagConfig.textColor}
      >
        {tagConfig.label}
      </Text>
    </Box>
  );

  if (transaction.fill?.fillType === FillType.AutoDeleveraging) {
    return (
      <button
        type="button"
        onClick={handleAdlClick}
        className="cursor-pointer bg-transparent border-none p-0"
        data-testid="perps-fill-tag-adl-button"
      >
        {pill}
      </button>
    );
  }

  return pill;
};

export default PerpsFillTag;
