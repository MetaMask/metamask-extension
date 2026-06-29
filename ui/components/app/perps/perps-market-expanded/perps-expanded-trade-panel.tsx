import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import {
  usePerpsLiveAccount,
  usePerpsLivePrices,
} from '../../../../hooks/perps/stream';
import { getTradeableBalance } from '../../../../hooks/perps/getTradeableBalance';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  OrderEntry,
  formStateToOrderParams,
  type OrderFormState,
} from '../order-entry';
import { PERPS_TOAST_KEYS, usePerpsToast } from '../perps-toast';
import { translatePerpsError } from '../utils/translate-perps-error';
import type { PerpsBackgroundResult } from '../types';

export type PerpsExpandedTradePanelProps = {
  /** Market symbol being traded. */
  symbol: string;
  /** Max leverage allowed for this market. */
  maxLeverage: number;
  /** Initial leverage for new orders. */
  initialLeverage?: number;
  /** Market size decimals for position-size formatting. */
  sizeDecimals?: number;
  /** Opens the geo-block modal when the account is not eligible. */
  onGeoBlocked: () => void;
};

/**
 * Trade ticket panel for the expanded perps view.
 *
 * Subscribes to the live account (for balance) and the live price stream (for
 * order calculations) locally — the page does not lift price into shared state.
 * Wraps the existing {@link OrderEntry} form for parity with the order entry
 * page.
 */
export const PerpsExpandedTradePanel = React.memo(
  ({
    symbol,
    maxLeverage,
    initialLeverage,
    sizeDecimals,
    onGeoBlocked,
  }: PerpsExpandedTradePanelProps) => {
    const t = useI18nContext();
    const selectedAccount = useSelector(getSelectedInternalAccount);
    const selectedAddress = selectedAccount?.address;
    const { isEligible } = usePerpsEligibility();
    const { replacePerpsToastByKey } = usePerpsToast();

    const { account } = usePerpsLiveAccount();
    const symbols = useMemo(() => [symbol], [symbol]);
    const { prices } = usePerpsLivePrices({ symbols });
    const livePrice = Number.parseFloat(prices[symbol]?.price ?? '');
    const currentPrice =
      Number.isFinite(livePrice) && livePrice > 0 ? livePrice : 0;

    const availableBalance = account
      ? Number.parseFloat(getTradeableBalance(account))
      : 0;

    const handleSubmit = useCallback(
      async (formState: OrderFormState) => {
        if (!isEligible) {
          onGeoBlocked();
          return;
        }
        if (!selectedAddress || currentPrice <= 0) {
          return;
        }

        replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS });

        try {
          const result = await submitRequestToBackground<PerpsBackgroundResult>(
            'perpsPlaceOrder',
            [formStateToOrderParams(formState, currentPrice)],
          );
          if (!result.success) {
            throw new Error(result.error ?? 'Order failed');
          }
          submitRequestToBackground('perpsSaveTradeConfiguration', [
            formState.asset,
            formState.leverage,
          ]).catch(() => undefined);

          const successToastKey =
            formState.type === 'limit'
              ? PERPS_TOAST_KEYS.ORDER_PLACED
              : PERPS_TOAST_KEYS.ORDER_SUBMITTED;
          replacePerpsToastByKey({
            key: successToastKey,
            ...(successToastKey === PERPS_TOAST_KEYS.ORDER_SUBMITTED
              ? { autoHideTime: 3000 }
              : {}),
          });
        } catch (error) {
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_FAILED,
            description:
              translatePerpsError(error, t as (key: string) => string) ??
              t('perpsToastOrderFailedDescriptionFallback'),
          });
        }
      },
      [
        isEligible,
        onGeoBlocked,
        selectedAddress,
        currentPrice,
        replacePerpsToastByKey,
        t,
      ],
    );

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 min-w-0 overflow-y-auto p-3"
        data-testid="perps-expanded-trade-panel"
      >
        <OrderEntry
          asset={symbol}
          currentPrice={currentPrice}
          maxLeverage={maxLeverage}
          availableBalance={availableBalance}
          initialLeverage={initialLeverage}
          sizeDecimals={sizeDecimals}
          onSubmit={handleSubmit}
        />
      </Box>
    );
  },
);

PerpsExpandedTradePanel.displayName = 'PerpsExpandedTradePanel';
