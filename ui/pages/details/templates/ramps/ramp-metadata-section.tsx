import React from 'react';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { isValidTransactionHash } from '../../../../../shared/lib/transactions.utils';
import { AccountName } from '../../../../components/app/transaction/account-name';
import { NetworkName } from '../../../../components/app/transaction/network-name';
import { TransactionId } from '../../../../components/app/transaction/transaction-id';
import { TransactionStatus } from '../../../../components/app/transaction/transaction-status';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Row, Section } from '../../components/shared';

type RampOrderItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

/**
 * Ramps metadata rows, including an optional provider status description
 * under the status pill.
 *
 * @param props - Component props.
 * @param props.item - Mapped ramp activity item.
 * @param props.statusDescription - Provider status copy shown for non-success.
 * @returns The ramps metadata section.
 */
export function RampMetadataSection({
  item,
  statusDescription,
}: {
  item: RampOrderItem;
  statusDescription?: string;
}) {
  const t = useI18nContext();
  const { formatDateTime } = useFormatters();
  const accountAddress = item.data.from;
  const txId =
    item.hash &&
    (!item.chainId?.startsWith('eip155:') || isValidTransactionHash(item.hash))
      ? item.hash
      : undefined;

  return (
    <Section>
      <Row
        label={t('status')}
        value={
          <div className="flex flex-col items-end gap-0.5">
            <TransactionStatus status={item.status} hash={item.hash} />
            {statusDescription ? (
              <span className="text-right text-s-body-sm text-alternative">
                {statusDescription}
              </span>
            ) : null}
          </div>
        }
      />

      <Row label={t('date')} value={formatDateTime(item.timestamp)} />

      <Row
        label={t('account')}
        value={<AccountName address={accountAddress} />}
      />

      {item.chainId ? (
        <Row
          label={t('network')}
          value={<NetworkName chainId={item.chainId} />}
        />
      ) : null}

      <Row
        label={t('transactionIdLabel')}
        value={txId ? <TransactionId value={txId} /> : null}
      />
    </Section>
  );
}
