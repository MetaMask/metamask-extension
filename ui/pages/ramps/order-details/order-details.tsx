import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsOrders } from '../../../hooks/ramps/useRampsOrders';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
import OrderContent from './components/order-content';

/**
 * Ramps order details screen. Renders a "not found" state when the order
 * cannot be resolved from the ramps orders store; resolved-order rendering
 * is added in a later task.
 * @returns The rendered order details screen.
 */
export function RampsOrderDetailsScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById } = useRampsOrders();

  const order = orderId ? getOrderById(orderId) : undefined;

  const goToWalletOverview = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  if (!order) {
    return (
      <RampsSelectionPage
        title={t('rampsOrderDetailsTitle')}
        onBack={goToWalletOverview}
        testId="ramps-order-details-not-found"
        backButtonTestId="ramps-order-details-back"
      >
        <RampsSelectionCenteredMessage
          message={t('rampsOrderDetailsNotFound')}
        />
        <Box
          className="border-t border-border-muted px-4 py-3"
          flexDirection={BoxFlexDirection.Column}
        >
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
