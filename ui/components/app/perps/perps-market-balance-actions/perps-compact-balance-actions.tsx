import React, { useCallback, useId, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontFamily,
  Popover,
  PopoverPosition,
  PopoverRole,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type PerpsCompactBalanceActionsProps = {
  totalBalance: number;
  availableBalance: number;
  privacyMode: boolean;
  isAddFundsLoading: boolean;
  onAddFunds: () => void;
  onWithdraw: () => void;
};

/**
 * One row: the available balance on the left and small actions on the right,
 * bottom-aligned. Hovering or focusing the balance also shows the total
 * balance. Withdraw is hidden when the account holds nothing.
 *
 * @param props - The component props.
 * @param props.totalBalance - Total account value.
 * @param props.availableBalance - Amount available to trade or withdraw.
 * @param props.privacyMode - Whether amounts are masked.
 * @param props.isAddFundsLoading - Whether Add funds is loading.
 * @param props.onAddFunds - Called when Add funds is pressed.
 * @param props.onWithdraw - Called when Withdraw is pressed.
 */
export const PerpsCompactBalanceActions = ({
  totalBalance,
  availableBalance,
  privacyMode,
  isAddFundsLoading,
  onAddFunds,
  onWithdraw,
}: PerpsCompactBalanceActionsProps) => {
  const t = useI18nContext();
  const { formatCurrency } = useFormatters();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [balanceReference, setBalanceReference] = useState<HTMLElement | null>(
    null,
  );
  const tooltipId = useId();

  const showTooltip = useCallback(() => {
    setIsTooltipOpen(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setIsTooltipOpen(false);
  }, []);

  const maskedAmount = '•'.repeat(Number(SensitiveTextLength.Short));
  const tooltipLabel = t('perpsTotalAndAvailableToTradeOrWithdraw', [
    privacyMode ? maskedAmount : formatCurrency(totalBalance, 'USD'),
    privacyMode ? maskedAmount : formatCurrency(availableBalance, 'USD'),
  ]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.End}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      className="w-full"
      data-testid="perps-compact-balance-actions"
    >
      <Box className="min-w-0">
        <Box
          ref={setBalanceReference}
          className="w-fit max-w-full"
          tabIndex={0}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          aria-describedby={isTooltipOpen ? tooltipId : undefined}
          data-testid="perps-compact-balance-actions-trigger"
        >
          <SensitiveText
            variant={TextVariant.DisplayMd}
            fontFamily={FontFamily.Hero}
            isHidden={privacyMode}
            length={SensitiveTextLength.Medium}
            className="truncate md:text-s-display-md md:leading-s-display-md md:font-bold md:tracking-s-display-md"
            data-testid="perps-compact-balance-actions-available"
          >
            {formatCurrency(availableBalance, 'USD')}
          </SensitiveText>
        </Box>
        <Popover
          id={tooltipId}
          role={PopoverRole.Tooltip}
          isOpen={isTooltipOpen}
          referenceElement={balanceReference}
          position={PopoverPosition.TopStart}
          isPortal
          preventOverflow
          flip
          onPressEscKey={hideTooltip}
          className="z-[200]"
          data-testid="perps-compact-balance-actions-tooltip"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
            {tooltipLabel}
          </Text>
        </Popover>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="shrink-0"
      >
        {totalBalance > 0 && (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={onWithdraw}
            data-testid="perps-balance-actions-withdraw"
          >
            {t('perpsWithdraw')}
          </Button>
        )}
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Sm}
          isLoading={isAddFundsLoading}
          onClick={onAddFunds}
          disabled={isAddFundsLoading}
          data-testid="perps-balance-actions-add-funds"
        >
          {t('perpsAddFunds')}
        </Button>
      </Box>
    </Box>
  );
};
