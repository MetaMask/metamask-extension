import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { RampsOrderStatus, type RampsOrder } from '@metamask/ramps-controller';
import type { CaipChainId } from '@metamask/utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { formatDate } from '../../../../helpers/utils/util';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import { getRampsNetworkDetailsForCaipChainId } from '../../token-selection/utils/mapRampsTokensToSendAssets';

const PENDING_STATUSES = new Set<RampsOrderStatus>([
  RampsOrderStatus.Pending,
  RampsOrderStatus.Created,
  RampsOrderStatus.Precreated,
  RampsOrderStatus.Unknown,
]);

const FAILED_STATUSES = new Set<RampsOrderStatus>([
  RampsOrderStatus.Failed,
  RampsOrderStatus.Cancelled,
  RampsOrderStatus.IdExpired,
]);

/**
 * Determine whether an order status is pending/non-terminal.
 * @param status - The order's current status.
 * @returns True if the order has not reached a terminal (completed/failed)
 * state.
 */
export function isPendingStatus(status: RampsOrderStatus): boolean {
  return PENDING_STATUSES.has(status);
}

/**
 * Resolve the text color for an order status.
 * @param status - The order's current status.
 * @returns The design-system text color token for the status.
 */
function getStatusColor(status: RampsOrderStatus): TextColor {
  if (status === RampsOrderStatus.Completed) {
    return TextColor.SuccessDefault;
  }
  if (FAILED_STATUSES.has(status)) {
    return TextColor.ErrorDefault;
  }
  return TextColor.WarningDefault;
}

/**
 * Shorten a long order id for display, keeping the trailing characters.
 * @param id - The full order id.
 * @returns The shortened id, or the original id if it is already short.
 */
function shortenOrderId(id: string): string {
  return id.length > 8 ? `...${id.slice(-6)}` : id;
}

type OrderRowProps = { label: string; children: React.ReactNode };

/**
 * A single labeled row within the order details content.
 * @param options0 - The row's props.
 * @param options0.label - The row's label text.
 * @param options0.children - The row's value content.
 * @returns The rendered row.
 */
const OrderRow = ({ label, children }: OrderRowProps) => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      className="py-3"
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {label}
      </Text>
      {children}
    </Box>
  );
};

/**
 * Renders the fields of a resolved ramps order: token amount, status,
 * copyable order id, view-on-provider link, date, fees, and total.
 * @param options0 - The component's props.
 * @param options0.order - The resolved ramps order to display.
 * @returns The rendered order content.
 */
export function OrderContent({ order }: { order: RampsOrder }) {
  const t = useI18nContext();
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

  const isPending = isPendingStatus(order.status);
  const fiatSymbol = order.fiatCurrency?.symbol ?? 'USD';
  const fiatDecimals = order.fiatCurrency?.decimals ?? 2;

  const caipChainId = (order.network?.chainId ??
    order.cryptoCurrency?.chainId ??
    '') as CaipChainId;
  const { networkName, networkImage } = getRampsNetworkDetailsForCaipChainId(
    caipChainId,
    order.network?.name,
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex-1 overflow-y-auto px-4"
      data-testid="ramps-order-content"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={3}
        className="py-6"
      >
        <BadgeWrapper
          badge={
            <AvatarNetwork
              src={networkImage}
              name={networkName}
              size={AvatarNetworkSize.Sm}
            />
          }
        >
          <AvatarToken
            src={order.cryptoCurrency?.iconUrl}
            name={order.cryptoCurrency?.symbol}
            size={AvatarTokenSize.Xl}
            imageProps={{ 'data-testid': 'ramps-order-details-token-icon' }}
          />
        </BadgeWrapper>
        {isPending && !order.cryptoAmount ? (
          <Box
            className="h-[24px] w-[120px] rounded bg-background-muted"
            data-testid="ramps-order-details-amount-skeleton"
          />
        ) : (
          <Text
            variant={TextVariant.DisplayMd}
            data-testid="ramps-order-details-token-amount"
          >
            {`${order.cryptoAmount} ${order.cryptoCurrency?.symbol ?? ''}`}
          </Text>
        )}
        {isPending ? (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            data-testid="ramps-order-details-pending-message"
            className="mt-2 text-center"
          >
            {t('rampsOrderDetailsPendingMessage')}
          </Text>
        ) : null}
      </Box>

      <OrderRow label={t('rampsOrderDetailsStatus')}>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.End}
        >
          <Text
            variant={TextVariant.BodyMd}
            color={getStatusColor(order.status)}
            data-testid="ramps-order-details-status"
          >
            {order.status}
          </Text>
          {order.providerOrderLink ? (
            <a
              href={order.providerOrderLink}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="ramps-order-details-view-on-provider"
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.PrimaryDefault}
              >
                {t('rampsOrderDetailsViewOnProvider', [
                  order.provider?.name ?? '',
                ])}
              </Text>
            </a>
          ) : null}
        </Box>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsOrderId')}>
        <button
          type="button"
          onClick={() => handleCopy(order.providerOrderId)}
          data-testid="ramps-order-details-order-id"
          aria-label={t('copyToClipboard')}
          className="flex items-center gap-1"
        >
          <Text variant={TextVariant.BodyMd}>
            {shortenOrderId(order.providerOrderId)}
          </Text>
          <Icon name={IconName.Copy} size={IconSize.Sm} />
        </button>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsDateAndTime')}>
        <Text
          variant={TextVariant.BodyMd}
          data-testid="ramps-order-details-date"
        >
          {formatDate(order.createdAt)}
        </Text>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsFees')}>
        <Text
          variant={TextVariant.BodyMd}
          data-testid="ramps-order-details-fees"
        >
          {formatCurrency(
            String(order.totalFeesFiat),
            fiatSymbol,
            fiatDecimals,
          )}
        </Text>
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsTotal')}>
        <Text
          variant={TextVariant.BodyMd}
          data-testid="ramps-order-details-total"
        >
          {formatCurrency(String(order.fiatAmount), fiatSymbol, fiatDecimals)}
        </Text>
      </OrderRow>
    </Box>
  );
}

export default OrderContent;
