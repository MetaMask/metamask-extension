// ponytail: DEV-ONLY harness to exercise the order-details page (TRAM-3718)
// before the real checkout-return handoff exists (step 5 — currently unowned;
// see docs/superpowers/specs/2026-07-20-ramps-order-details-page-design.md).
// It simulates that handoff: seed a mock order into the controller for the
// selected account, then navigate to the real page so getOrderById resolves it.
// DO NOT MERGE — drop this file, its route constant, and its route registration.
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  RampsOrderStatus,
  type RampsOrder,
} from '@metamask/ramps-controller';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { addRampsOrder } from '../../../store/controller-actions/ramps-controller';
import { RAMPS_ORDER_DETAILS_ROUTE } from '../../../helpers/constants/routes';

function buildMockOrder(
  walletAddress: string,
  status: RampsOrderStatus,
): RampsOrder {
  const providerOrderId = `dev-order-${status.toLowerCase()}-1234567890`;
  return {
    providerOrderId,
    providerOrderLink: 'https://global.transak.com/orders',
    status,
    createdAt: 1_700_000_000_000,
    cryptoAmount: status === RampsOrderStatus.Pending ? '' : '0.5',
    fiatAmount: 1000,
    totalFeesFiat: 12.5,
    cryptoCurrency: {
      symbol: 'ETH',
      iconUrl: 'https://on-ramp-content.uat-api.cx.metamask.io/assets/eth.png',
      decimals: 18,
      chainId: 'eip155:1',
    },
    fiatCurrency: { symbol: 'USD', decimals: 2 },
    network: { name: 'Ethereum', chainId: 'eip155:1' },
    provider: { id: 'transak', name: 'Transak' },
    walletAddress,
  } as unknown as RampsOrder;
}

/**
 * Dev-only harness for the ramps order-details page. Not part of the product.
 *
 * @returns Buttons that seed a mock order and jump to the real order-details page.
 */
export function RampsDevOrderHarness() {
  const navigate = useNavigate();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const walletAddress = selectedAccount?.address ?? '';

  const seedAndGo = useCallback(
    async (status: RampsOrderStatus) => {
      const order = buildMockOrder(walletAddress, status);
      await addRampsOrder(order);
      navigate(
        RAMPS_ORDER_DETAILS_ROUTE.replace(':orderId', order.providerOrderId),
      );
    },
    [navigate, walletAddress],
  );

  const goToError = useCallback(() => {
    navigate(RAMPS_ORDER_DETAILS_ROUTE.replace(':orderId', 'nonexistent-id'));
  }, [navigate]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={3}
      className="p-4"
      data-testid="ramps-dev-order-harness"
    >
      <Text variant={TextVariant.HeadingSm}>Order details dev harness</Text>
      <Text variant={TextVariant.BodySm}>
        Selected account: {walletAddress || '(none — unlock/select an account)'}
      </Text>
      <Button
        variant={ButtonVariant.Primary}
        onClick={() => seedAndGo(RampsOrderStatus.Completed)}
        isFullWidth
      >
        Seed completed order → open
      </Button>
      <Button
        variant={ButtonVariant.Primary}
        onClick={() => seedAndGo(RampsOrderStatus.Pending)}
        isFullWidth
      >
        Seed pending order → open
      </Button>
      <Button
        variant={ButtonVariant.Secondary}
        onClick={goToError}
        isFullWidth
      >
        Open with unknown id → error state
      </Button>
    </Box>
  );
}

export default RampsDevOrderHarness;
