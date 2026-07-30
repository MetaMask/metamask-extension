import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  twMerge,
  TextVariant,
  TextColor,
  IconColor,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
  SensitiveText,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  ButtonBase,
} from '@metamask/design-system-react';
import type { Position } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  PRICE_RANGES_MINIMAL_VIEW,
} from '../../../../../shared/lib/perps-formatters';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { usePerpsLiveAccount } from '../../../../hooks/perps/stream';
import { useSelectedAccountComplianceGate } from '../../compliance';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import { PerpsControlBarSkeleton } from '../perps-skeletons';
import { useOnClickOutside } from '../hooks/useClickOutside';
import { getPrivacyAwareColor } from '../utils';

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

export type PerpsBalanceDropdownProps = {
  /** Whether the user has open positions (controls P&L row visibility) */
  hasPositions?: boolean;
  /** The only open position, used to keep single-position RoE synced with the card */
  singlePosition?: Position;
  /** Callback when Add funds button is pressed */
  onAddFunds?: PerpsBalanceActionHandler;
  /** Callback when Withdraw button is pressed */
  onWithdraw?: PerpsBalanceActionHandler;
};

/**
 * PerpsBalanceDropdown displays total balance, unrealized P&L,
 * and a dropdown with Add funds / Withdraw actions at the top of the Perps tab.
 *
 * @param options0 - Component props
 * @param options0.hasPositions - Whether the user has open positions (controls P&L row visibility)
 * @param options0.onAddFunds - Callback when Add funds button is pressed
 * @param options0.onWithdraw - Callback when Withdraw button is pressed
 * @param options0.singlePosition - The only open position, if exactly one is open
 */
export const PerpsBalanceDropdown: React.FC<PerpsBalanceDropdownProps> = ({
  hasPositions = false,
  singlePosition,
  onAddFunds,
  onWithdraw,
}) => {
  const t = useI18nContext();
  const { account, isInitialLoading } = usePerpsLiveAccount();
  const { formatPercentWithMinThreshold } = useFormatters();
  const { isEligible } = usePerpsEligibility();
  const { gate } = useSelectedAccountComplianceGate();
  const { privacyMode } = useSelector(getPreferences);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  const totalBalance = account?.totalBalance ?? '0';
  const unrealizedPnl = account?.unrealizedPnl ?? '0';
  const singlePositionReturnOnEquity = singlePosition?.returnOnEquity;
  const accountReturnOnEquity = account?.returnOnEquity ?? '0';

  // totalBalance is HL accountValue (perps equity, already includes unrealizedPnl) + spot
  const accountValue = Number.parseFloat(totalBalance);

  const pnlNum = Number.parseFloat(unrealizedPnl);
  const isProfit = pnlNum >= 0;
  const pnlPrefix = isProfit ? '+' : '-';
  const pnlColor = getPrivacyAwareColor(
    isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault,
    privacyMode,
  );
  const formattedPnl = `${pnlPrefix}${formatPerpsFiat(Math.abs(pnlNum), {
    ranges: PRICE_RANGES_MINIMAL_VIEW,
  })}`;
  const formattedRoe =
    singlePositionReturnOnEquity === undefined
      ? formatPercentWithMinThreshold(
          Number.parseFloat(accountReturnOnEquity) / 100,
        )
      : formatPercentWithMinThreshold(
          Number.parseFloat(singlePositionReturnOnEquity),
        );

  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleAddFunds = useCallback(() => {
    gate(() => {
      if (!isEligible) {
        setIsGeoBlockModalOpen(true);
        return;
      }
      invokePerpsBalanceAction(onAddFunds);
    }).catch((error: unknown) => {
      console.error(error);
    });
  }, [gate, isEligible, onAddFunds]);

  const handleWithdraw = useCallback(() => {
    invokePerpsBalanceAction(onWithdraw);
  }, [onWithdraw]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useOnClickOutside({
    containerRef,
    onClickOutside: () => setIsDropdownOpen(false),
    active: isDropdownOpen,
  });

  if (isInitialLoading) {
    return <PerpsControlBarSkeleton />;
  }

  const rowBaseStyles = 'w-full bg-muted px-4 py-3';
  const balanceRowStyles = hasPositions
    ? 'rounded-t-xl rounded-b-none hover:bg-muted-hover active:bg-muted-pressed'
    : 'rounded-xl hover:bg-muted-hover active:bg-muted-pressed';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      data-testid="perps-balance-dropdown"
      ref={containerRef}
    >
      {/* Balance row wrapper -- serves as the positioning anchor for the dropdown */}
      <Box className="relative">
        <ButtonBase
          className={twMerge(rowBaseStyles, balanceRowStyles)}
          onClick={handleToggleDropdown}
          data-testid="perps-balance-dropdown-balance"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            className="w-full"
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsTotalBalance')}
            </Text>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
            >
              <SensitiveText
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                isHidden={privacyMode}
              >
                {formatPerpsFiat(accountValue, {
                  ranges: PRICE_RANGES_MINIMAL_VIEW,
                })}
              </SensitiveText>
              <Icon
                name={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
                size={IconSize.Xs}
                color={IconColor.IconAlternative}
                data-testid="perps-balance-dropdown-chevron"
              />
            </Box>
          </Box>
        </ButtonBase>

        {/* Floating dropdown menu anchored to the balance row */}
        {isDropdownOpen && (
          <Box
            className="absolute right-0 top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg"
            flexDirection={BoxFlexDirection.Column}
            data-testid="perps-balance-dropdown-panel"
          >
            <ButtonBase
              className="w-full justify-between text-left rounded-none px-3 py-2 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
              onClick={handleAddFunds}
              data-testid="perps-balance-dropdown-add-funds"
            >
              <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
                {t('perpsAddFunds')}
              </Text>
            </ButtonBase>
            <ButtonBase
              className="w-full justify-between text-left rounded-none px-3 py-2 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
              onClick={handleWithdraw}
              data-testid="perps-balance-dropdown-withdraw"
            >
              <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
                {t('perpsWithdraw')}
              </Text>
            </ButtonBase>
          </Box>
        )}
      </Box>

      {/* Unrealized P&L Row - only shown when there are positions */}
      {hasPositions && (
        <Box
          className="w-full rounded-t-none rounded-b-xl bg-muted px-4 py-3 -mt-px"
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          data-testid="perps-balance-dropdown-pnl"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsUnrealizedPnl')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Baseline}
            gap={1}
          >
            <SensitiveText
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={pnlColor}
              isHidden={privacyMode}
              data-testid="perps-balance-dropdown-pnl-value"
            >
              {formattedPnl}
            </SensitiveText>
            <SensitiveText
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={pnlColor}
              isHidden={privacyMode}
              data-testid="perps-balance-dropdown-roe-value"
            >
              {`(${formattedRoe})`}
            </SensitiveText>
          </Box>
        </Box>
      )}
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </Box>
  );
};

export default PerpsBalanceDropdown;
