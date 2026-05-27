import React, { useMemo } from 'react';
import { Icon, IconName, IconSize, Text } from '@metamask/design-system-react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { MULTICHAIN_NETWORK_TO_NICKNAME } from '../../../../shared/constants/multichain/networks';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import {
  getStatusKey,
  QUEUED_PSEUDO_STATUS,
  SIGNING_PSUEDO_STATUS,
} from '../../../components/app/transaction-status-label';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ActivityListItemAvatar } from '../../../components/app/activity-list-item-avatar';
import { ChainBadge } from '../../../components/app/chain-badge/chain-badge';
import { StatusIcon } from '../../../components/ui/icon/status-icon';
import { getActivityListItemAvatarConfig } from '../resolve-activity-avatar-config';
import { useFormatFiatAmount } from '../useFormatFiatAmount';
import { useFormatTokenAmount } from '../useFormatTokenAmount';
import { shouldShowSecondaryTokenAmount } from '../helpers';
import { useGetLabel } from '../useGetLabel';
import type { ActivityCellProps } from './types';

function getCellTokenAmounts(activity: ActivityCellProps['data']) {
  switch (activity.type) {
    case 'swap':
    case 'bridge':
    case 'convert':
    case 'lendingWithdrawal':
      return {
        primaryToken: activity.data.destinationToken,
        secondaryToken: activity.data.sourceToken,
      };
    case 'swapIncomplete':
      return {
        primaryToken: activity.data.sourceToken,
        secondaryToken: undefined,
      };
    case 'send':
    case 'receive':
    case 'buy':
    case 'claim':
    case 'claimMusdBonus':
    case 'lendingDeposit':
    case 'nftMint':
    case 'contractInteraction':
      return {
        primaryToken: activity.data.token,
        secondaryToken: undefined,
      };
    default:
      return {
        primaryToken: undefined,
        secondaryToken: undefined,
      };
  }
}

const renderDescriptionLine = (
  pendingStatusText: string | undefined,
  description: string | undefined,
) => {
  if (pendingStatusText && description) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <Icon
          name={IconName.Clock}
          size={IconSize.Xs}
          className="shrink-0 text-alternative"
        />
        <Text variant="body-sm" className="shrink-0 text-alternative">
          {pendingStatusText}
        </Text>
        <Text variant="body-sm" className="shrink-0 text-alternative">
          •
        </Text>
        <Text variant="body-sm" className="truncate text-alternative">
          {description}
        </Text>
      </div>
    );
  }

  if (pendingStatusText) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <Icon
          name={IconName.Clock}
          size={IconSize.Xs}
          className="shrink-0 text-alternative"
        />
        <Text variant="body-sm" className="shrink-0 text-alternative">
          {pendingStatusText}
        </Text>
      </div>
    );
  }

  if (description) {
    return (
      <Text variant="body-sm" className="truncate text-alternative">
        {description}
      </Text>
    );
  }

  return null;
};

type ActivityTransactionStatus = {
  txStatus: string;
  pendingSubtitleKey?:
    | typeof SIGNING_PSUEDO_STATUS
    | typeof QUEUED_PSEUDO_STATUS;
};

function getTransactionStatus(
  data: ActivityCellProps['data'],
): ActivityTransactionStatus {
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;
  const { primaryTransaction } = transactionGroup ?? {};
  const isEarliestNonce = data.isEarliestNonce ?? false;

  let txStatus: string;
  if (
    primaryTransaction?.status === TransactionStatus.confirmed &&
    primaryTransaction.type === TransactionType.cancel
  ) {
    txStatus = 'cancelled';
  } else if (data.status === 'success') {
    txStatus = 'confirmed';
  } else {
    txStatus = data.status;
  }

  if (!primaryTransaction?.status) {
    return { txStatus };
  }

  const pendingSubtitleKey = getStatusKey(
    primaryTransaction.status,
    isEarliestNonce,
  );

  if (
    pendingSubtitleKey === SIGNING_PSUEDO_STATUS ||
    pendingSubtitleKey === QUEUED_PSEUDO_STATUS
  ) {
    return { txStatus, pendingSubtitleKey };
  }

  return { txStatus };
}

export function GenericActivityCell({
  data,
  onClick,
}: Readonly<ActivityCellProps>) {
  const t = useI18nContext();
  const formatTokenAmount = useFormatTokenAmount();
  const { description, title } = useGetLabel(data);
  const { txStatus, pendingSubtitleKey } = getTransactionStatus(data);
  const pendingStatusText = pendingSubtitleKey
    ? t(pendingSubtitleKey)
    : undefined;
  const { primaryToken, secondaryToken } = getCellTokenAmounts(data);

  const { namespace } = parseCaipChainId(data.chainId);
  const chainId =
    namespace === KnownCaipNamespace.Eip155
      ? convertCaipToHexChainId(data.chainId)
      : data.chainId;
  const networkName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
    MULTICHAIN_NETWORK_TO_NICKNAME[
      data.chainId as keyof typeof MULTICHAIN_NETWORK_TO_NICKNAME
    ] ??
    data.chainId;
  const fiatAmount = useFormatFiatAmount(data, primaryToken, chainId);
  const primaryTokenAmount = formatTokenAmount(primaryToken, data.type);
  const secondaryTokenAmount = formatTokenAmount(secondaryToken, data.type);
  const secondaryDisplay = shouldShowSecondaryTokenAmount(data.type)
    ? secondaryTokenAmount
    : (fiatAmount ?? secondaryTokenAmount);

  const avatarConfig = useMemo(
    () =>
      getActivityListItemAvatarConfig(data, primaryToken, secondaryToken, {
        chainIdForImage: data.chainId,
        hexChainId: chainId,
        networkName,
      }),
    [data, primaryToken, secondaryToken, chainId, networkName],
  );

  return (
    <div
      className="grid min-h-[70px] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-transform duration-200 ease-out hover:bg-hover cursor-pointer"
      role="button"
      data-testid="activity-list-item"
      data-tx-status={txStatus}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <ChainBadge chainId={chainId}>
          <ActivityListItemAvatar config={avatarConfig} />
        </ChainBadge>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1">
          <Text
            className={`min-w-0 truncate font-medium ${
              data.status === 'failed' ? 'text-error-default' : ''
            }`}
            data-testid="activity-list-item-action"
          >
            {title}
          </Text>
          {data.status === 'pending' && !pendingStatusText ? (
            <span
              className="shrink-0"
              data-testid="activity-list-item-pending-spinner"
            >
              <StatusIcon state="loading" className="w-5 h-5" />
            </span>
          ) : null}
        </div>
        {renderDescriptionLine(pendingStatusText, description)}
      </div>
      <div className="text-right whitespace-nowrap">
        {primaryTokenAmount ? (
          <Text
            className={`text-sm font-medium ${
              primaryToken?.direction === 'in' ? 'text-success-default' : ''
            }`}
            data-testid="transaction-list-item-primary-currency"
          >
            {primaryTokenAmount}
          </Text>
        ) : null}
        {secondaryDisplay ? (
          <Text
            variant="body-sm"
            className="text-alternative"
            data-testid="transaction-list-item-secondary-currency"
          >
            {secondaryDisplay}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
