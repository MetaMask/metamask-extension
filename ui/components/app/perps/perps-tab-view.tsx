import React, { useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ButtonBase,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import log from 'loglevel';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PERPS_MARKET_LIST_ROUTE } from '../../../helpers/constants/routes';
import { mockPositions, mockOrders } from './mocks';
import { PositionCard } from './position-card';
import { OrderCard } from './order-card';
import { PerpsTabControlBar } from './perps-tab-control-bar';
import { StartTradeCta } from './start-trade-cta';
import { PerpsEmptyState } from './perps-empty-state';

/**
 * PerpsTabView component displays the perpetuals trading tab
 * with positions and orders sections using mock data
 */
export const PerpsTabView: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const hasPositions = mockPositions.length > 0;
  const hasOrders = mockOrders.length > 0;
  const hasNoPositionsOrOrders = !hasPositions && !hasOrders;

  const handleManageBalancePress = () => {
    // TODO: Navigate to manage balance screen
    log.info('handleManageBalancePress');
  };

  const handleNewTrade = () => {
    // TODO: Navigate to trading view or tutorial for first-time users
    log.info('handleNewTrade');
  };

  const handleSearchPress = useCallback(() => {
    navigate(PERPS_MARKET_LIST_ROUTE);
  }, [navigate]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      data-testid="perps-tab-view"
    >
      {/* Header with Search Icon */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={2}
      >
        <ButtonBase
          onClick={handleSearchPress}
          className="rounded-full p-2 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
          data-testid="perps-search-button"
          aria-label={t('perpsSearchMarkets')}
        >
          <Icon
            name={IconName.Search}
            size={IconSize.Md}
            color={IconColor.IconDefault}
          />
        </ButtonBase>
      </Box>

      {/* Control Bar with Balance and P&L */}
      <PerpsTabControlBar
        onManageBalancePress={handleManageBalancePress}
        hasPositions={hasPositions}
      />

      {/* Empty State */}
      {hasNoPositionsOrOrders && (
        <PerpsEmptyState onStartTrade={handleNewTrade} />
      )}

      {/* Positions Section */}
      {hasPositions && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="perps-positions-section"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={4}
            marginBottom={2}
          >
            <Text fontWeight={FontWeight.Medium}>{t('perpsPositions')}</Text>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsCloseAll')}
            </Text>
          </Box>
          <Box flexDirection={BoxFlexDirection.Column}>
            {mockPositions.map((position) => (
              <PositionCard key={position.coin} position={position} />
            ))}
          </Box>
          <StartTradeCta onPress={handleNewTrade} />
        </Box>
      )}

      {/* Orders Section */}
      {hasOrders && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="perps-orders-section"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={4}
            marginBottom={2}
          >
            <Text fontWeight={FontWeight.Medium}>{t('perpsOpenOrders')}</Text>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsCloseAll')}
            </Text>
          </Box>
          <Box flexDirection={BoxFlexDirection.Column}>
            {mockOrders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PerpsTabView;
