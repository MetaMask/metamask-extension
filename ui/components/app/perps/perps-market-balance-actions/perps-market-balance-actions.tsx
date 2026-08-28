import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextAlign,
} from '@metamask/design-system-react';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  usePerpsEligibility,
  usePerpsEventTracking,
} from '../../../../hooks/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsLiveAccount } from '../../../../hooks/perps/stream';
import { getTradeableBalance } from '../../../../hooks/perps/getTradeableBalance';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import { PerpsBalanceActionsSkeleton } from '../perps-skeletons';

/** Handler from perps triggers (e.g. deposit / withdraw); may return a Promise. */
export type PerpsBalanceActionHandler = () => void | Promise<unknown>;

/**
 * Runs an optional UI callback that may be sync or async. If it returns a
 * rejected promise, the failure is logged so it does not surface as an
 * unhandled rejection (e.g. event handlers cannot be `async` in all call sites).
 *
 * @param callback - Optional handler; may return a Promise.
 */
export function invokePerpsBalanceAction(
  callback?: PerpsBalanceActionHandler,
): void {
  Promise.resolve(callback?.()).catch((error: unknown) => {
    console.error(error);
  });
}

type PerpsMarketBalanceActionsProps = {
  /** Whether to show the action buttons (Add funds, Withdraw) */
  showActionButtons?: boolean;
  /** Whether add funds transaction creation is in progress */
  isAddFundsLoading?: boolean;
  /** Callback when Add funds button is pressed */
  onAddFunds?: PerpsBalanceActionHandler;
  /** Callback when Withdraw button is pressed */
  onWithdraw?: PerpsBalanceActionHandler;
  /** Callback when Learn more button is pressed */
  onLearnMore?: () => void;
};

const PerpsMarketBalanceActions = ({
  showActionButtons = true,
  isAddFundsLoading = false,
  onAddFunds,
  onWithdraw,
  onLearnMore,
}: PerpsMarketBalanceActionsProps) => {
  const t = useI18nContext();
  const { track } = usePerpsEventTracking();
  const { formatCurrency } = useFormatters();
  const { account, isInitialLoading } = usePerpsLiveAccount();
  const { isEligible } = usePerpsEligibility();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  // Use account data or defaults
  const totalBalance = account?.totalBalance ?? '0';
  // "available" label on perps home reflects the order-entry (tradeable)
  // balance: for HyperLiquid unified accounts this folds unreserved spot USDC
  // on top of the withdrawable perps balance.
  const availableBalance = getTradeableBalance(account);

  // totalBalance is HL accountValue (perps equity, already includes unrealizedPnl) + spot
  const accountValue = parseFloat(totalBalance);
  const isBalanceEmpty = accountValue === 0;

  // Report where the button was clicked from so PERPS_UI_INTERACTION can be
  // filtered by surface. The persistent header maps to PERPS_HOME; the
  // empty-state CTA maps to PERPS_HOME_EMPTY_STATE (mobile parity).
  const buttonLocation = isBalanceEmpty
    ? PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME_EMPTY_STATE
    : PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME;

  const handleAddFunds = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.DEPOSIT,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]: buttonLocation,
    });
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    invokePerpsBalanceAction(onAddFunds);
  }, [buttonLocation, isEligible, onAddFunds, track]);

  const handleWithdraw = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.WITHDRAW,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]: buttonLocation,
    });
    invokePerpsBalanceAction(onWithdraw);
  }, [buttonLocation, onWithdraw, track]);

  const handleLearnMore = useCallback(() => {
    onLearnMore?.();
  }, [onLearnMore]);

  const geoBlockModal = (
    <PerpsGeoBlockModal
      isOpen={isGeoBlockModalOpen}
      onClose={() => setIsGeoBlockModalOpen(false)}
    />
  );

  // Show a skeleton while the initial account snapshot is being fetched so we
  // don't flash the zero-balance empty state before real data arrives.
  if (isInitialLoading) {
    return <PerpsBalanceActionsSkeleton />;
  }

  // Empty state - no balance. Reuses the `perps-balance-actions` testid so
  // callers that only need to know the header rendered (empty OR loaded) can
  // wait on a single selector. The empty-only add-funds CTA keeps a distinct
  // `-add-funds-empty` testid.
  if (isBalanceEmpty) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        paddingTop={4}
        paddingBottom={4}
        data-testid="perps-balance-actions"
      >
        {/* Empty state icon placeholder */}
        <Box
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          marginBottom={4}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-background-alternative)',
          }}
        >
          <Text variant={TextVariant.HeadingLg}>📈</Text>
        </Box>

        <Box marginBottom={2}>
          <Text
            variant={TextVariant.HeadingMd}
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Center}
          >
            {t('perpsTradePerps')}
          </Text>
        </Box>

        <Box marginBottom={6}>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
          >
            {t('perpsAddFundsDescription')}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={3}
          style={{ width: '100%' }}
        >
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isLoading={isAddFundsLoading}
            onClick={handleAddFunds}
            disabled={isAddFundsLoading}
            style={{ width: '100%' }}
            data-testid="perps-balance-actions-add-funds-empty"
          >
            {t('perpsAddFunds')}
          </Button>

          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={handleLearnMore}
            style={{ width: '100%' }}
            data-testid="perps-balance-actions-learn-more"
          >
            {t('perpsLearnMore')}
          </Button>
        </Box>
        {geoBlockModal}
      </Box>
    );
  }

  // Balance state - has balance
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="perps-balance-actions"
    >
      {/* Account Value (includes unrealized PnL) */}
      <Text
        variant={TextVariant.DisplayMd}
        fontWeight={FontWeight.Medium}
        data-testid="perps-balance-actions-total"
      >
        {formatCurrency(accountValue, 'USD')}
      </Text>

      {/* Available Balance */}
      <Box marginTop={1}>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="perps-balance-actions-available"
        >
          {formatCurrency(parseFloat(availableBalance), 'USD')}{' '}
          {t('perpsAvailable').toLowerCase()}
        </Text>
      </Box>

      {/* Action Buttons */}
      {showActionButtons && (
        <Box flexDirection={BoxFlexDirection.Row} gap={3} marginTop={4}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={handleWithdraw}
            style={{ flex: 1 }}
            data-testid="perps-balance-actions-withdraw"
          >
            {t('perpsWithdraw')}
          </Button>

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isLoading={isAddFundsLoading}
            onClick={handleAddFunds}
            disabled={isAddFundsLoading}
            style={{ flex: 1 }}
            data-testid="perps-balance-actions-add-funds"
          >
            {t('perpsAddFunds')}
          </Button>
        </Box>
      )}
      {geoBlockModal}
    </Box>
  );
};

export default PerpsMarketBalanceActions;
