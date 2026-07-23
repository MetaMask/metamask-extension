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
import { useFormatters } from '../../../../hooks/useFormatters';
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
 * Resolve the i18n key for a humanized status label (mobile parity — groups
 * the raw enum into complete / processing / failed / cancelled).
 * @param status - The order's current status.
 * @returns The i18n message key for the status label.
 */
function getStatusLabelKey(status: RampsOrderStatus): string {
  if (status === RampsOrderStatus.Completed) {
    return 'rampsOrderStatusComplete';
  }
  if (status === RampsOrderStatus.Cancelled) {
    return 'rampsOrderStatusCancelled';
  }
  if (FAILED_STATUSES.has(status)) {
    return 'rampsOrderStatusFailed';
  }
  return 'rampsOrderStatusProcessing';
}

/**
 * Shorten a long order id for display, keeping the trailing characters.
 * @param id - The full order id.
 * @returns The shortened id, or the original id if it is already short.
 */
function shortenOrderId(id: string): string {
  return id.length > 8 ? `...${id.slice(-6)}` : id;
}

type ValueSkeletonProps = { testId: string; className?: string };

/**
 * A grey placeholder bar shown in place of an amount value while a pending
 * order's amounts are still resolving.
 * @param options0 - The component's props.
 * @param options0.testId - The test id for the skeleton element.
 * @param options0.className - Size override (defaults to a row-value bar).
 * @returns The rendered skeleton bar.
 */
const ValueSkeleton = ({
  testId,
  className = 'h-[18px] w-[80px]',
}: ValueSkeletonProps) => (
  <Box
    className={`${className} rounded bg-background-muted`}
    data-testid={testId}
  />
);

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
  const { formatTokenAmount } = useFormatters();

  const isPending = isPendingStatus(order.status);
  // Amounts are still resolving on a pending order that has no crypto amount
  // yet (mobile parity: skeleton the amount rows until they arrive).
  const showAmountSkeletons = isPending && !order.cryptoAmount;
  const fiatSymbol = order.fiatCurrency?.symbol ?? 'USD';
  const fiatDecimals = order.fiatCurrency?.decimals ?? 2;
  const bankDetails = order.paymentDetails ?? [];

  // formatCurrency(String(undefined)) would render "$NaN"; mirror
  // formatTokenAmount's graceful empty for non-finite fiat values.
  const formatFiat = (value: unknown) =>
    Number.isFinite(Number(value))
      ? formatCurrency(String(value), fiatSymbol, fiatDecimals)
      : '';

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
          className="self-center"
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
        {showAmountSkeletons ? (
          <ValueSkeleton
            testId="ramps-order-details-amount-skeleton"
            className="h-[24px] w-[120px]"
          />
        ) : (
          <Text
            variant={TextVariant.DisplayMd}
            data-testid="ramps-order-details-token-amount"
          >
            {formatTokenAmount(
              Number(order.cryptoAmount),
              order.cryptoCurrency?.symbol ?? '',
            )}
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
            {t(getStatusLabelKey(order.status))}
          </Text>
          {order.statusDescription && !isPending ? (
            // ponytail: inline description instead of mobile's modal — conveys
            // the same info without a modal or a deprecated Tooltip import.
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              data-testid="ramps-order-details-status-description"
              className="text-right"
            >
              {order.statusDescription}
            </Text>
          ) : null}
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
        {showAmountSkeletons ? (
          <ValueSkeleton testId="ramps-order-details-fees-skeleton" />
        ) : (
          <Text
            variant={TextVariant.BodyMd}
            data-testid="ramps-order-details-fees"
          >
            {formatFiat(order.totalFeesFiat)}
          </Text>
        )}
      </OrderRow>

      <OrderRow label={t('rampsOrderDetailsTotal')}>
        {showAmountSkeletons ? (
          <ValueSkeleton testId="ramps-order-details-total-skeleton" />
        ) : (
          <Text
            variant={TextVariant.BodyMd}
            data-testid="ramps-order-details-total"
          >
            {formatFiat(order.fiatAmount)}
          </Text>
        )}
      </OrderRow>

      {bankDetails.length > 0 ? (
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="mt-4 border-t border-muted pt-4"
          data-testid="ramps-order-details-bank-details"
        >
          <Text variant={TextVariant.BodyMd} className="pb-1 font-medium">
            {t('rampsOrderDetailsBankDetails')}
          </Text>
          {bankDetails.flatMap((detail) =>
            detail.fields.map((field) => (
              <OrderRow key={field.id} label={field.name}>
                <Text variant={TextVariant.BodyMd}>{field.value}</Text>
              </OrderRow>
            )),
          )}
        </Box>
      ) : null}
    </Box>
  );
}

export default OrderContent;
