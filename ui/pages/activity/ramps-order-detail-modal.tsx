import React from 'react';
import type { RampsOrder } from '@metamask/ramps-controller';
import { Text, TextVariant } from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../components/component-library';
import {
  formatCreatedAt,
  formatCryptoAmount,
  formatFiatAmount,
  getOrderKey,
} from './ramps-order-card';

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
};

const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-border-muted py-2 last:border-b-0">
    <Text variant={TextVariant.BodySm} className="text-alternative">
      {label}
    </Text>
    <Text variant={TextVariant.BodySm} className="break-all">
      {value}
    </Text>
  </div>
);

type RampsOrderDetailModalProps = {
  order: RampsOrder;
  onClose: () => void;
};

export const RampsOrderDetailModal = ({
  order,
  onClose,
}: RampsOrderDetailModalProps) => {
  const orderKey = getOrderKey(order);

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent data-testid="ramps-order-detail-modal">
        <ModalHeader onClose={onClose}>Order details</ModalHeader>
        <div className="px-4 pb-4">
          <DetailRow label="Order ID" value={orderKey} />
          <DetailRow
            label="Provider"
            value={order.provider?.name ?? order.provider?.id ?? '—'}
          />
          <DetailRow label="Status" value={order.status} />
          <DetailRow label="Type" value={order.orderType ?? '—'} />
          <DetailRow label="Fiat" value={formatFiatAmount(order)} />
          <DetailRow label="Crypto" value={formatCryptoAmount(order)} />
          <DetailRow label="Wallet" value={order.walletAddress} />
          <DetailRow
            label="Network"
            value={order.network?.name ?? order.network?.chainId ?? '—'}
          />
          <DetailRow
            label="Payment"
            value={order.paymentMethod?.name ?? order.paymentMethod?.id ?? '—'}
          />
          <DetailRow label="Created" value={formatCreatedAt(order.createdAt)} />
          <DetailRow label="Tx hash" value={order.txHash || '—'} />
          <DetailRow label="Region" value={order.region ?? '—'} />
          <DetailRow
            label="Provider link"
            value={
              order.providerOrderLink ? (
                <a
                  href={order.providerOrderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-default underline"
                >
                  Open
                </a>
              ) : (
                '—'
              )
            }
          />
          <div className="mt-4">
            <Text
              variant={TextVariant.BodySm}
              className="mb-2 text-alternative"
            >
              Raw payload
            </Text>
            <pre className="max-h-64 overflow-auto rounded-lg bg-background-muted p-3 text-xs whitespace-pre-wrap">
              {JSON.stringify(order, null, 2)}
            </pre>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
