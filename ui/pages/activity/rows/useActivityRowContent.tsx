import React from 'react';
import cn from 'clsx';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { MULTICHAIN_NETWORK_TO_NICKNAME } from '../../../../shared/constants/multichain/networks';
import { getLabelKeys } from '../../../../shared/lib/activity/label-keys';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import type { ActivityListItemAvatarTokens } from '../../../components/app/activity-list-item-avatar';
import { ChainBadge } from '../../../components/app/chain-badge/chain-badge';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import type { ActivityRowProps } from '../types';
import { useFormatFiatAmount } from './useFormatFiatAmount';
import { useFormatTokenAmount } from './useFormatTokenAmount';

type ActivityContent = {
  title: string;
  subtitle?: string;
  primaryToken?: TokenAmount;
  secondaryToken?: TokenAmount;
  avatarTokens: ActivityListItemAvatarTokens;
};

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

export function useActivityRowContent(activity: ActivityRowProps['data']) {
  const t = useI18nContext();
  const formatTokenAmount = useFormatTokenAmount();
  const labelKeys = getLabelKeys({
    type: activity.type,
    status: activity.status,
  });

  const getContent = (): ActivityContent => {
    switch (activity.type) {
      case 'send':
      case 'receive': {
        const { token, from, to } = activity.data;
        const address = activity.type === 'receive' ? from : to;
        const symbol = token?.symbol ?? '';

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key, [symbol]),
          subtitle: t(labelKeys.description.key, [
            shortenAddress(address) || t('unknown'),
          ]),
          primaryToken: token,
        };
      }
      // Source and destination in title
      case 'swap': {
        const { sourceToken, destinationToken } = activity.data;
        const sourceSymbol = sourceToken?.symbol ?? '';
        const destinationSymbol = destinationToken?.symbol ?? '';

        return {
          avatarTokens: [sourceToken?.assetId, destinationToken?.assetId],
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
          avatarTokens: [sourceToken?.assetId, destinationToken?.assetId],
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
          avatarTokens: [sourceToken?.assetId, destinationToken?.assetId],
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
          avatarTokens: [destinationToken?.assetId ?? sourceToken?.assetId],
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
          avatarTokens: destinationToken
            ? [sourceToken?.assetId, destinationToken?.assetId]
            : [sourceToken?.assetId],
          title: t(labelKeys.title.key, [symbol]),
          primaryToken: destinationToken ?? sourceToken,
          ...(destinationToken ? { secondaryToken: sourceToken } : {}),
        };
      }
      case 'swapIncomplete': {
        const { sourceToken } = activity.data;

        return {
          avatarTokens: [sourceToken?.assetId],
          title: t(labelKeys.title.key, [sourceToken?.symbol ?? '']),
          subtitle: t(labelKeys.description.key),
          primaryToken: sourceToken,
        };
      }
      case 'buy':
      case 'claim':
      case 'deposit': {
        const { token } = activity.data;
        const symbol = token?.symbol ?? '';

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key, [symbol]),
          subtitle: t(labelKeys.description.key, [symbol]),
          primaryToken: token,
        };
      }
      case 'nftMint': {
        const { token } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key, [token?.symbol ?? 'NFT']),
          subtitle: t(labelKeys.description.key),
          primaryToken: token,
        };
      }
      case 'contractInteraction': {
        const { token, to } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key, [
            shortenAddress(to) || 'Contract',
          ]),
          primaryToken: token,
        };
      }
      case 'approveSpendingCap':
      case 'increaseSpendingCap':
      case 'revokeSpendingCap': {
        const { token } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key, [token?.symbol ?? '']),
          primaryToken: token?.amount ? token : undefined,
        };
      }
      case 'lendingDeposit': {
        const { sourceToken, destinationToken } = activity.data;
        const primaryToken = destinationToken ?? sourceToken;

        return {
          avatarTokens: [primaryToken?.assetId],
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
          primaryToken,
          secondaryToken: destinationToken ? sourceToken : undefined,
        };
      }
      case 'claimMusdBonus': {
        const { token } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
          primaryToken: token,
        };
      }
      default:
        return {
          avatarTokens: [],
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
        };
    }
  };

  const content = getContent();
  const { primaryToken, secondaryToken, avatarTokens } = content;
  const { chainId } = getChainDisplay(activity);
  const fiatAmount = useFormatFiatAmount(
    activity,
    secondaryToken ? undefined : primaryToken,
    chainId,
  );

  return {
    avatar: (
      <ChainBadge chainId={chainId}>
        <ActivityAvatar tokens={avatarTokens} />
      </ChainBadge>
    ),
    title: (
      <span
        className={cn(
          'truncate',
          activity.status === 'failed' && 'text-error-default',
        )}
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
        {formatTokenAmount(primaryToken, activity.type)}
      </span>
    ),
    secondaryAmount: secondaryToken
      ? formatTokenAmount(secondaryToken, activity.type)
      : fiatAmount,
  };
}
