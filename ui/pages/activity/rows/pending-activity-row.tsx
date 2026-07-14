import React from 'react';
import { Icon, IconName, IconSize, Text } from '@metamask/design-system-react';
import { usePendingTransactionGasModal } from '../../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider';
import { TransactionListItemPendingActions } from '../../../components/app/transaction-list-item/transaction-list-item-pending-actions';
import { StatusIcon } from '../../../components/ui/status-icon/status-icon';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { ActivityRowProps } from '../types';
import { useActivityCellStatus } from '../helpers';
import { ActivityRowLayout } from './activity-row-layout';
import { useActivityRowContent } from './useActivityRowContent';

export function PendingActivityRow({
  data,
  onClick,
}: Readonly<ActivityRowProps>) {
  const t = useI18nContext();
  const { avatar, title, subtitle, primaryAmount, secondaryAmount } =
    useActivityRowContent(data);
  const { pendingSubtitleKey, transactionGroup, txStatus } =
    useActivityCellStatus(data);
  const isEarliestNonce = data.isEarliestNonce ?? false;
  const { setEditGasMode, onGasModalMetaId } = usePendingTransactionGasModal();
  // Signing/queued transactions show their status in the subtitle, while an
  // actively pending transaction shows a loading spinner next to the title.
  const pendingStatusText = pendingSubtitleKey
    ? t(pendingSubtitleKey)
    : undefined;

  const pendingSubtitle = pendingStatusText ? (
    <div className="flex min-w-0 items-center gap-1">
      <Icon
        name={IconName.Clock}
        size={IconSize.Xs}
        className="shrink-0 text-alternative"
      />
      <Text variant="body-sm" className="shrink-0 text-alternative">
        {pendingStatusText}
      </Text>
      {subtitle ? (
        <>
          <Text variant="body-sm" className="shrink-0 text-alternative">
            •
          </Text>
          <Text variant="body-sm" className="truncate text-alternative">
            {subtitle}
          </Text>
        </>
      ) : null}
    </div>
  ) : (
    subtitle
  );

  const pendingTitle = pendingStatusText ? (
    title
  ) : (
    <>
      {title}
      <span
        className="shrink-0"
        data-testid="activity-list-item-pending-spinner"
      >
        <StatusIcon state="loading" className="w-5 h-5" />
      </span>
    </>
  );

  if (!transactionGroup) {
    return (
      <ActivityRowLayout
        avatar={avatar}
        title={pendingTitle}
        subtitle={pendingSubtitle}
        primaryAmount={primaryAmount}
        secondaryAmount={secondaryAmount}
        onClick={onClick}
        txStatus={txStatus}
      />
    );
  }

  return (
    <>
      <ActivityRowLayout
        avatar={avatar}
        title={pendingTitle}
        subtitle={pendingSubtitle}
        primaryAmount={primaryAmount}
        secondaryAmount={secondaryAmount}
        onClick={onClick}
        txStatus={txStatus}
      />

      <TransactionListItemPendingActions
        transactionGroup={transactionGroup}
        isEarliestNonce={isEarliestNonce}
        setEditGasMode={setEditGasMode}
        onGasModalMetaId={onGasModalMetaId}
      />
    </>
  );
}
