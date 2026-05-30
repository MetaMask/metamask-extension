import React from 'react';
import cn from 'clsx';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { MULTICHAIN_NETWORK_TO_NICKNAME } from '../../../../shared/constants/multichain/networks';
import { getLabelKeys } from '../../../../shared/lib/activity/label-keys';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { ActivityListItemAvatar } from '../../../components/app/activity-list-item-avatar';
import { ChainBadge } from '../../../components/app/chain-badge/chain-badge';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { ActivityRowProps } from '../types';
import { getActivityListItemAvatarConfig } from '../resolve-activity-avatar-config';
import { useFormatFiatAmount } from './useFormatFiatAmount';
import { useFormatTokenAmount } from './useFormatTokenAmount';

function getChainDisplay(activity: ActivityRowProps['data']) {
  const { namespace } = parseCaipChainId(activity.chainId);
  const chainId =
    namespace === KnownCaipNamespace.Eip155
      ? convertCaipToHexChainId(activity.chainId)
      : activity.chainId;
  const networkName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
    MULTICHAIN_NETWORK_TO_NICKNAME[
      activity.chainId as keyof typeof MULTICHAIN_NETWORK_TO_NICKNAME
    ] ??
    activity.chainId;

  return { chainId, networkName };
}

export function useActivityCellPresentation(
  activity: ActivityRowProps['data'],
) {
  const t = useI18nContext();
  const formatTokenAmount = useFormatTokenAmount();
  const labelKeys = getLabelKeys({
    type: activity.type,
    status: activity.status,
  });

  const getContent = () => {
    switch (activity.type) {
      case 'send':
      case 'receive': {
        const { token, from, to } = activity.data;
        const address = activity.type === 'receive' ? from : to;
        const symbol = token?.symbol ?? '';

        return {
          title: t(labelKeys.title.key, [symbol]),
          subtitle: t(labelKeys.description.key, [
            shortenAddress(address) || t('unknown'),
          ]),
          primaryToken: token,
          secondaryToken: undefined,
        };
      }
      // Source and destination in title
      case 'swap': {
        const { sourceToken, destinationToken } = activity.data;
        const sourceSymbol = sourceToken?.symbol ?? '';
        const destinationSymbol = destinationToken?.symbol ?? '';

        return {
          title: t(labelKeys.title.key, [sourceSymbol, destinationSymbol]),
          subtitle: t(labelKeys.description.key),
          primaryToken: destinationToken,
          secondaryToken: sourceToken,
        };
      }
      case 'wrap': {
        const { sourceToken, destinationToken } = activity.data;
        const sourceSymbol = sourceToken?.symbol;
        const destinationSymbol = destinationToken?.symbol;
        const subtitle =
          sourceSymbol && destinationSymbol
            ? `${sourceSymbol} → ${destinationSymbol}`
            : t(labelKeys.description.key, [destinationSymbol ?? '']);

        return {
          title: t(labelKeys.title.key, [sourceSymbol ?? '']),
          subtitle,
          primaryToken: destinationToken,
          secondaryToken: sourceToken,
        };
      }
      case 'unwrap':
      case 'convert': {
        const { sourceToken, destinationToken } = activity.data;
        const sourceSymbol = sourceToken?.symbol;
        const destinationSymbol = destinationToken?.symbol;
        const subtitle =
          sourceSymbol && destinationSymbol
            ? `${sourceSymbol} → ${destinationSymbol}`
            : t(labelKeys.description.key, [destinationSymbol ?? '']);

        return {
          title: t(labelKeys.title.key, [destinationSymbol ?? '']),
          subtitle,
          primaryToken: destinationToken,
          secondaryToken: sourceToken,
        };
      }
      case 'lendingWithdrawal': {
        const { sourceToken, destinationToken } = activity.data;
        const symbol = destinationToken?.symbol ?? '';

        return {
          title: t(labelKeys.title.key, [symbol]),
          subtitle: t(labelKeys.description.key, [symbol]),
          primaryToken: destinationToken,
          secondaryToken: sourceToken,
        };
      }
      // Token in title. API bridge rows may only include the source leg.
      case 'bridge': {
        const { sourceToken, destinationToken } = activity.data;
        const symbol = destinationToken?.symbol ?? sourceToken?.symbol ?? '';

        return {
          title: t(labelKeys.title.key, [symbol]),
          subtitle: undefined,
          primaryToken: destinationToken ?? sourceToken,
          secondaryToken: destinationToken ? sourceToken : undefined,
        };
      }
      case 'swapIncomplete':
        return {
          title: t(labelKeys.title.key, [
            activity.data.sourceToken?.symbol ?? '',
          ]),
          subtitle: t(labelKeys.description.key),
          primaryToken: activity.data.sourceToken,
          secondaryToken: undefined,
        };
      case 'buy':
      case 'claim':
      case 'deposit': {
        const symbol = activity.data.token?.symbol ?? '';

        return {
          title: t(labelKeys.title.key, [symbol]),
          subtitle: t(labelKeys.description.key, [symbol]),
          primaryToken: activity.data.token,
          secondaryToken: undefined,
        };
      }
      case 'nftMint':
        return {
          title: t(labelKeys.title.key, [activity.data.token?.symbol ?? 'NFT']),
          subtitle: t(labelKeys.description.key),
          primaryToken: activity.data.token,
          secondaryToken: undefined,
        };
      case 'contractInteraction':
        return {
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key, [
            shortenAddress(activity.data.to) || 'Contract',
          ]),
          primaryToken: activity.data.token,
          secondaryToken: undefined,
        };
      case 'approveSpendingCap':
      case 'increaseSpendingCap':
      case 'revokeSpendingCap':
        return {
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key, [
            activity.data.token?.symbol ?? '',
          ]),
          primaryToken: activity.data.token?.amount
            ? activity.data.token
            : undefined,
          secondaryToken: undefined,
        };
      case 'lendingDeposit':
        return {
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
          primaryToken:
            activity.data.destinationToken ?? activity.data.sourceToken,
          secondaryToken: activity.data.destinationToken
            ? activity.data.sourceToken
            : undefined,
        };
      case 'claimMusdBonus':
        return {
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
          primaryToken: activity.data.token,
          secondaryToken: undefined,
        };
      default:
        return {
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
          primaryToken: undefined,
          secondaryToken: undefined,
        };
    }
  };

  const content = getContent();
  const { primaryToken, secondaryToken } = content;
  const { chainId, networkName } = getChainDisplay(activity);
  const fiatAmount = useFormatFiatAmount(
    activity,
    secondaryToken ? undefined : primaryToken,
    chainId,
  );
  const primaryTokenAmount = formatTokenAmount(primaryToken, activity.type);
  const secondaryTokenAmount = formatTokenAmount(secondaryToken, activity.type);
  const secondaryDisplay = secondaryToken ? secondaryTokenAmount : fiatAmount;
  const avatarConfig = getActivityListItemAvatarConfig(
    activity,
    primaryToken,
    secondaryToken,
    {
      chainIdForImage: activity.chainId,
      hexChainId: chainId,
      networkName,
    },
  );

  return {
    avatar: (
      <ChainBadge chainId={chainId}>
        <ActivityListItemAvatar config={avatarConfig} />
      </ChainBadge>
    ),
    title: (
      <span
        className={cn(activity.status === 'failed' && 'text-error-default')}
      >
        {content.title}
      </span>
    ),
    subtitle: content.subtitle,
    primaryAmount: (
      <span
        className={cn(
          primaryToken?.direction === 'in' && 'text-success-default',
        )}
      >
        {primaryTokenAmount}
      </span>
    ),
    secondaryAmount: secondaryDisplay,
  };
}
