import React, { useMemo } from 'react';
import { Icon, IconName, IconSize, Text } from '@metamask/design-system-react';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { formatUnits } from 'viem';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { MULTICHAIN_NETWORK_TO_NICKNAME } from '../../../../shared/constants/multichain/networks';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ActivityListItemAvatar } from '../../../components/app/activity-list-item-avatar';
import { ChainBadge } from '../../../components/app/chain-badge/chain-badge';
import { getActivityListItemAvatarConfig } from '../resolve-activity-avatar-config';
import { useGetLabel } from '../useGetLabel';
import type { ActivityCellProps } from './types';

function trimDecimalZeroes(value: string) {
  if (!value.includes('.')) {
    return value;
  }

  return value.replace(/\.?0+$/, '');
}

function formatTokenAmountValue({ amount, decimals }: TokenAmount) {
  if (!amount) {
    return undefined;
  }

  if (decimals === undefined) {
    return trimDecimalZeroes(amount);
  }

  try {
    return trimDecimalZeroes(formatUnits(BigInt(amount), decimals));
  } catch {
    return amount;
  }
}

function formatTokenAmount(tokenAmount: TokenAmount) {
  const value = formatTokenAmountValue(tokenAmount);

  if (!value) {
    return undefined;
  }

  const sign = tokenAmount.direction === 'in' ? '+' : '-';

  return `${sign}${value}${tokenAmount.symbol ? ` ${tokenAmount.symbol}` : ''}`;
}

function getCellTokenAmounts(activity: ActivityCellProps['data']) {
  switch (activity.type) {
    case 'swap':
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

export function GenericActivityCell({ data, onClick }: ActivityCellProps) {
  const t = useI18nContext();
  const { description, title } = useGetLabel(data);
  const pendingStatusText =
    data.status === 'pending' ? t(data.status) : undefined;
  const { primaryToken, secondaryToken } = getCellTokenAmounts(data);
  const primaryTokenAmount = primaryToken
    ? formatTokenAmount(primaryToken)
    : undefined;
  const secondaryTokenAmount = secondaryToken
    ? formatTokenAmount(secondaryToken)
    : undefined;
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
      className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-transform duration-200 ease-out hover:bg-hover cursor-pointer"
      role="button"
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <ChainBadge chainId={chainId}>
          <ActivityListItemAvatar config={avatarConfig} />
        </ChainBadge>
      </div>
      <div className="min-w-0">
        <Text
          className="font-medium truncate"
          data-testid="activity-list-item-action"
        >
          {title}
        </Text>
        {renderDescriptionLine(pendingStatusText, description)}
      </div>
      <div className="text-right whitespace-nowrap">
        {primaryTokenAmount ? (
          <Text
            className={`text-sm font-medium ${
              primaryToken?.direction === 'in' ? 'text-success-default' : ''
            }`}
          >
            {primaryTokenAmount}
          </Text>
        ) : null}
        {secondaryTokenAmount ? (
          <Text variant="body-sm" className="text-alternative">
            {secondaryTokenAmount}
          </Text>
        ) : null}
        {/* Debug type and hash are hidden while the amount UI is wired */}
      </div>
    </div>
  );
}
