import React from 'react';
import classnames from 'classnames';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
  TextColor,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { mockAccountState } from '../mocks';

export interface PerpsTabControlBarProps {
  /** Callback when balance row is clicked */
  onManageBalancePress?: () => void;
  /** Whether the user has open positions (controls P&L row visibility) */
  hasPositions?: boolean;
}

/**
 * Format a number as currency with $ prefix
 */
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format P&L with +/- prefix
 */
const formatPnl = (value: string): string => {
  const num = parseFloat(value);
  const prefix = num >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format ROE as percentage
 */
const formatPercentage = (value: string): string => {
  const num = parseFloat(value);
  return `${num.toFixed(2)}%`;
};

/**
 * PerpsTabControlBar displays total balance and unrealized P&L
 * at the top of the Perps tab
 */
export const PerpsTabControlBar: React.FC<PerpsTabControlBarProps> = ({
  onManageBalancePress,
  hasPositions = false,
}) => {
  const { totalBalance, unrealizedPnl, returnOnEquity } = mockAccountState;
  const pnlNum = parseFloat(unrealizedPnl);
  const isProfit = pnlNum >= 0;

  const handleBalanceClick = () => {
    onManageBalancePress?.();
  };

  return (
    <Box
      className="perps-tab-control-bar"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={0}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      data-testid="perps-tab-control-bar"
    >
      {/* Total Balance Row */}
      <Box
        as="button"
        className={classnames('perps-tab-control-bar__row', {
          'perps-tab-control-bar__row--top': hasPositions,
          'perps-tab-control-bar__row--single': !hasPositions,
        })}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        padding={3}
        onClick={handleBalanceClick}
        data-testid="perps-control-bar-balance"
      >
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          Total Balance
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={2}
        >
          <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Medium}>
            {formatCurrency(totalBalance)}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={TextColor.iconAlternative}
          />
        </Box>
      </Box>

      {/* Unrealized P&L Row - only shown when there are positions */}
      {hasPositions && (
        <Box
          className="perps-tab-control-bar__row perps-tab-control-bar__row--bottom"
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          padding={3}
          data-testid="perps-control-bar-pnl"
        >
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            Unrealized P&L
          </Text>
          <Text
            variant={TextVariant.bodySm}
            fontWeight={FontWeight.Medium}
            color={isProfit ? TextColor.successDefault : TextColor.errorDefault}
          >
            {formatPnl(unrealizedPnl)} ({formatPercentage(returnOnEquity)})
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PerpsTabControlBar;
