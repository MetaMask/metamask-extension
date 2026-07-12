import React from 'react';
import {
  type RampsOrder,
  RampsOrderStatus,
  getInternalOrderCode,
} from '@metamask/ramps-controller';
import { Text, TextVariant } from '@metamask/design-system-react';

const STATUS_LABEL_CLASS: Record<string, string> = {
  [RampsOrderStatus.Completed]: 'bg-success-muted text-success-default',
  [RampsOrderStatus.Pending]: 'bg-warning-muted text-warning-default',
  [RampsOrderStatus.Created]: 'bg-info-muted text-info-default',
  [RampsOrderStatus.Precreated]: 'bg-info-muted text-info-default',
  [RampsOrderStatus.Failed]: 'bg-error-muted text-error-default',
  [RampsOrderStatus.Cancelled]: 'bg-error-muted text-error-default',
  [RampsOrderStatus.IdExpired]: 'bg-error-muted text-error-default',
};

export function getOrderKey(order: RampsOrder): string {
  return getInternalOrderCode(order);
}

function truncateAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatCreatedAt(createdAt?: number): string {
  if (!createdAt) {
    return '—';
  }

  return new Date(createdAt).toLocaleString();
}

export function formatFiatAmount(order: RampsOrder): string {
  const symbol = order.fiatCurrency?.symbol ?? order.fiatCurrency?.denomSymbol;
  const amount = order.fiatAmount ?? order.fiatAmountInUsd;

  if (amount === undefined || amount === null) {
    return '—';
  }

  return symbol ? `${symbol} ${amount}` : String(amount);
}

export function formatCryptoAmount(order: RampsOrder): string {
  const symbol = order.cryptoCurrency?.symbol;
  const amount = order.cryptoAmount;

  if (amount === undefined || amount === null || amount === '') {
    return '—';
  }

  return symbol ? `${amount} ${symbol}` : String(amount);
}

function getStatusClassName(status: RampsOrderStatus | string): string {
  return STATUS_LABEL_CLASS[status] ?? 'bg-background-muted text-alternative';
}

type RampsOrderCardProps = {
  order: RampsOrder;
  onSelect: (order: RampsOrder) => void;
};

export const RampsOrderCard = ({ order, onSelect }: RampsOrderCardProps) => {
  const orderKey = getOrderKey(order);
  const providerName =
    order.provider?.name ?? order.provider?.id ?? 'Unknown provider';

  return (
    <button
      type="button"
      className="w-full rounded-xl border border-border-muted bg-background-default p-4 text-left transition-colors hover:bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-default"
      data-testid={`ramps-order-card-${orderKey}`}
      onClick={() => onSelect(order)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Text variant={TextVariant.BodyMd} className="truncate font-medium">
            {providerName}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            className="mt-1 truncate text-alternative"
          >
            {orderKey}
          </Text>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium uppercase ${getStatusClassName(order.status)}`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <Text variant={TextVariant.BodySm} className="text-alternative">
            Fiat
          </Text>
          <Text variant={TextVariant.BodyMd} className="font-medium">
            {formatFiatAmount(order)}
          </Text>
        </div>
        <div>
          <Text variant={TextVariant.BodySm} className="text-alternative">
            Crypto
          </Text>
          <Text variant={TextVariant.BodyMd} className="font-medium">
            {formatCryptoAmount(order)}
          </Text>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-alternative">
        <Text variant={TextVariant.BodySm}>
          {formatCreatedAt(order.createdAt)}
        </Text>
        <Text variant={TextVariant.BodySm}>
          {truncateAddress(order.walletAddress)}
        </Text>
      </div>
    </button>
  );
};
