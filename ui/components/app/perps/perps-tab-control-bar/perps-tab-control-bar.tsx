import React from 'react';
import classnames from 'classnames';
import {
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
import { formatCurrency, formatPnl, formatPercentage } from '../utils';
import { mockAccountState } from '../mocks';

export type PerpsTabControlBarProps = {
  /** Callback when balance row is clicked */
  onManageBalancePress?: () => void;
  /** Whether the user has open positions (controls P&L row visibility) */
  hasPositions?: boolean;
};

/**
 * PerpsTabControlBar displays total balance and unrealized P&L
 * at the top of the Perps tab
 *
 * @param options0 - Component props
 * @param options0.onManageBalancePress - Callback when balance row is clicked
 * @param options0.hasPositions - Whether the user has open positions (controls P&L row visibility)
 */
export const PerpsTabControlBar: React.FC<PerpsTabControlBarProps> = ({
  onManageBalancePress,
  hasPositions = false,
}) => {
  const t = useI18nContext();
  const { totalBalance, unrealizedPnl, returnOnEquity } = mockAccountState;
  const pnlNum = parseFloat(unrealizedPnl);
  const isProfit = pnlNum >= 0;

  const handleBalanceClick = () => {
    onManageBalancePress?.();
  };

  return (
    <Box
      className="perps-tab-control-bar"
      flexDirection={BoxFlexDirection.Column}
      gap={0}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      data-testid="perps-tab-control-bar"
    >
      {/* Total Balance Row */}
      <ButtonBase
        className={classnames('perps-tab-control-bar__row w-full', {
          'perps-tab-control-bar__row--top': hasPositions,
          'perps-tab-control-bar__row--single': !hasPositions,
        })}
        onClick={handleBalanceClick}
        data-testid="perps-control-bar-balance"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          className="w-full"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsTotalBalance')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
              {formatCurrency(totalBalance)}
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>
        </Box>
      </ButtonBase>

      {/* Unrealized P&L Row - only shown when there are positions */}
      {hasPositions && (
        <Box
          className="perps-tab-control-bar__row perps-tab-control-bar__row--bottom"
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          padding={3}
          data-testid="perps-control-bar-pnl"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsUnrealizedPnl')}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault}
          >
            {formatPnl(unrealizedPnl)} ({formatPercentage(returnOnEquity)})
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PerpsTabControlBar;
