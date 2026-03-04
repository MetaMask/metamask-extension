import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  ButtonBase,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsEligibility } from '../../../../hooks/perps';
import { usePerpsLiveAccount } from '../../../../hooks/perps/stream';

export type PerpsBalanceDropdownProps = {
  /** Whether the user has open positions (controls P&L row visibility) */
  hasPositions?: boolean;
  /** Callback when Add funds button is pressed */
  onAddFunds?: () => void;
  /** Callback when Withdraw button is pressed */
  onWithdraw?: () => void;
};

/**
 * PerpsBalanceDropdown displays total balance, unrealized P&L,
 * and a dropdown with Add funds / Withdraw actions at the top of the Perps tab.
 *
 * @param options0 - Component props
 * @param options0.hasPositions - Whether the user has open positions (controls P&L row visibility)
 * @param options0.onAddFunds - Callback when Add funds button is pressed
 * @param options0.onWithdraw - Callback when Withdraw button is pressed
 */
export const PerpsBalanceDropdown: React.FC<PerpsBalanceDropdownProps> = ({
  hasPositions = false,
  onAddFunds,
  onWithdraw,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold, formatPercentWithMinThreshold } =
    useFormatters();
  const { account } = usePerpsLiveAccount();
  const { isEligible } = usePerpsEligibility();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const totalBalance = account?.totalBalance ?? '0';
  const unrealizedPnl = account?.unrealizedPnl ?? '0';
  const returnOnEquity = account?.returnOnEquity ?? '0';

  const accountValue = parseFloat(totalBalance) + parseFloat(unrealizedPnl);

  const pnlNum = parseFloat(unrealizedPnl);
  const isProfit = pnlNum >= 0;
  const pnlPrefix = isProfit ? '+' : '-';
  const formattedPnl = `${pnlPrefix}${formatCurrencyWithMinThreshold(Math.abs(pnlNum), 'USD')}`;
  const formattedRoe = formatPercentWithMinThreshold(
    parseFloat(returnOnEquity) / 100,
  );

  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleAddFunds = useCallback(() => {
    if (!isEligible) {
      return;
    }
    onAddFunds?.();
  }, [isEligible, onAddFunds]);

  const handleWithdraw = useCallback(() => {
    onWithdraw?.();
  }, [onWithdraw]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

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
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
              >
                {formatCurrencyWithMinThreshold(accountValue, 'USD')}
              </Text>
              <Icon
                name={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
                size={IconSize.Sm}
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
              disabled={!isEligible}
              title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
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
          className="w-full rounded-t-none rounded-b-xl bg-muted px-4 py-3"
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          data-testid="perps-balance-dropdown-pnl"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsUnrealizedPnl')}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault}
          >
            {formattedPnl} ({formattedRoe})
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PerpsBalanceDropdown;
