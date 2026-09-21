import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
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
  /**
   * Callback when the (empty-balance-only) Learn more button is pressed. When
   * omitted the Learn more button is hidden even at $0 balance.
   */
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
  // Privacy mode masks fiat amounts across the wallet; the total + available
  // figures in this header are the biggest numbers on the Perps tab and must
  // be redacted the same way the old `PerpsBalanceDropdown` masked them.
  const { privacyMode } = useSelector(getPreferences);
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  // Use account data or defaults
  const totalBalance = account?.totalBalance ?? '0';
  // "available" label on perps home reflects the order-entry (tradeable)
  // balance: for HyperLiquid unified accounts this folds unreserved spot USDC
  // on top of the withdrawable perps balance.
  const availableBalance = getTradeableBalance(account);

  // totalBalance is HL accountValue (perps equity, already includes unrealizedPnl) + spot
  const accountValue = parseFloat(totalBalance);

  const handleAddFunds = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.DEPOSIT,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
    });
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    invokePerpsBalanceAction(onAddFunds);
  }, [isEligible, onAddFunds, track]);

  const handleWithdraw = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.WITHDRAW,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
    });
    invokePerpsBalanceAction(onWithdraw);
  }, [onWithdraw, track]);

  const handleLearnMore = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.TUTORIAL,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
    });
    onLearnMore?.();
  }, [onLearnMore, track]);

  const geoBlockModal = (
    <PerpsGeoBlockModal
      isOpen={isGeoBlockModalOpen}
      onClose={() => setIsGeoBlockModalOpen(false)}
    />
  );

  // Show a skeleton while the initial account snapshot is being fetched so we
  // don't flash the zero-balance state before real data arrives.
  if (isInitialLoading) {
    return <PerpsBalanceActionsSkeleton />;
  }

  // Renders the same balance header regardless of whether the account is
  // funded — zero-balance accounts still see the large "$0.00" / "$0.00
  // available" line and the persistent Withdraw + Add funds buttons (mobile
  // parity). No separate empty-state illustration.
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="perps-balance-actions"
    >
      {/* Account Value (includes unrealized PnL) */}
      <SensitiveText
        variant={TextVariant.DisplayMd}
        fontWeight={FontWeight.Medium}
        isHidden={privacyMode}
        length={SensitiveTextLength.Medium}
        data-testid="perps-balance-actions-total"
      >
        {formatCurrency(accountValue, 'USD')}
      </SensitiveText>

      {/*
        Available balance is only meaningful once the account is funded — at
        $0 total it would just repeat "$0.00" under the big zero, so we drop
        it to keep the empty-state header quiet.
      */}
      {accountValue > 0 && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          gap={1}
          marginTop={1}
          data-testid="perps-balance-actions-available"
        >
          <SensitiveText
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            isHidden={privacyMode}
            length={SensitiveTextLength.Short}
            data-testid="perps-balance-actions-available-value"
          >
            {formatCurrency(parseFloat(availableBalance), 'USD')}
          </SensitiveText>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('perpsAvailable').toLowerCase()}
          </Text>
        </Box>
      )}

      {/* Action Buttons */}
      {showActionButtons && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={3}
          marginTop={4}
          style={{ width: '100%' }}
        >
          {/*
            Withdraw is hidden when there's nothing to withdraw: at $0 balance
            it's a dead-end action, so Add funds becomes the single full-width
            primary CTA. Once funded, both buttons share the row 50/50.
          */}
          <Box flexDirection={BoxFlexDirection.Row} gap={3}>
            {accountValue > 0 && (
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                onClick={handleWithdraw}
                style={{ flex: 1 }}
                data-testid="perps-balance-actions-withdraw"
              >
                {t('perpsWithdraw')}
              </Button>
            )}

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

          {/*
            Learn more is only shown to accounts that haven't been funded yet;
            it's an educational entry point into the tutorial modal and would
            be redundant clutter once the user has a balance.
          */}
          {accountValue === 0 && onLearnMore && (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={handleLearnMore}
              style={{ width: '100%' }}
              data-testid="perps-balance-actions-learn-more"
            >
              {t('perpsLearnMore')}
            </Button>
          )}
        </Box>
      )}
      {geoBlockModal}
    </Box>
  );
};

export default PerpsMarketBalanceActions;
