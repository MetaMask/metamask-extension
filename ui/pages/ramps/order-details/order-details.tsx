import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
} from '@metamask/design-system-react';
import { normalizeProviderCode } from '@metamask/ramps-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsOrders } from '../../../hooks/ramps/useRampsOrders';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
import OrderContent, { isPendingStatus } from './components/order-content';

/**
 * Ramps order details screen. Renders a merged error state (covering both
 * an order that can't be resolved from the ramps orders store, and a
 * refresh that failed) or the resolved order content with a refresh
 * control.
 * @returns The rendered order details screen.
 */
export function RampsOrderDetailsScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById, refreshOrder } = useRampsOrders();

  const order = orderId ? getOrderById(orderId) : undefined;
  const [error, setError] = useState<string | null>(null);

  const goToWalletOverview = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleRefresh = useCallback(async () => {
    if (!order) {
      return;
    }
    try {
      setError(null);
      await refreshOrder(
        normalizeProviderCode(order.provider?.id ?? ''),
        order.providerOrderId,
        order.walletAddress,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [order, refreshOrder]);

  if (!order || error) {
    const onRetry = order ? handleRefresh : goToWalletOverview;
    return (
      <RampsSelectionPage
        title={t('rampsOrderDetailsTitle')}
        onBack={goToWalletOverview}
        testId="ramps-order-details-error"
        backButtonTestId="ramps-order-details-back"
      >
        <RampsSelectionCenteredMessage
          message={
            order ? t('rampsOrderDetailsError') : t('rampsOrderDetailsNotFound')
          }
        />
        <Box
          className="border-t border-border-muted px-4 py-3"
          flexDirection={BoxFlexDirection.Column}
        >
          <Button
            variant={ButtonVariant.Primary}
            onClick={onRetry}
            data-testid={
              order ? 'ramps-order-details-retry' : 'ramps-order-details-done'
            }
            isFullWidth
          >
            {order ? t('rampsOrderDetailsRetry') : t('rampsOrderDetailsDone')}
          </Button>
        </Box>
      </RampsSelectionPage>
    );
  }

  return (
    <RampsSelectionPage
      title={t('rampsOrderDetailsTitle')}
      onBack={goToWalletOverview}
      testId="ramps-order-details-screen"
      backButtonTestId="ramps-order-details-back"
    >
      <OrderContent order={order} />
      <Box
        className="border-t border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Column}
      >
        {isPendingStatus(order.status) ? (
          <Button
            variant={ButtonVariant.Secondary}
            onClick={handleRefresh}
            data-testid="ramps-order-details-refresh"
            isFullWidth
          >
            {t('rampsOrderDetailsRetry')}
          </Button>
        ) : null}
        <Button
          variant={ButtonVariant.Primary}
          onClick={goToWalletOverview}
          data-testid="ramps-order-details-done"
          isFullWidth
        >
          {t('rampsOrderDetailsDone')}
        </Button>
      </Box>
    </RampsSelectionPage>
  );
}

export default RampsOrderDetailsScreen;
