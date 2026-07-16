import React, { type ReactNode } from 'react';
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
// eslint-disable-next-line import-x/no-restricted-paths
import { PERPS_CURRENCY } from '../../confirmations/constants/perps';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { useFormatters } from '../../../hooks/useFormatters';
import type { ActivityRowProps } from '../types';
import { useFormatFiatAmount } from './useFormatFiatAmount';
import { useFormatTokenAmount } from './useFormatTokenAmount';

type ActivityContent = {
  title: string;
  subtitle?: string;
  primaryAmount?: ReactNode;
  primaryDirection?: TokenAmount['direction'];
  secondaryAmount?: ReactNode;
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
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const { chainId } = getChainDisplay(activity);
  const formatAsFiat = useFormatFiatAmount(chainId);
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
          primaryAmount: formatTokenAmount(token),
          primaryDirection: token?.direction,
          secondaryAmount: formatAsFiat(token),
        };
      }
      // Source and destination in title; two tokens in avatar
      case 'swap': {
        const { sourceToken, destinationToken } = activity.data;
        const sourceSymbol = sourceToken?.symbol ?? '';
        const destinationSymbol = destinationToken?.symbol ?? '';

        return {
          avatarTokens: [sourceToken?.assetId, destinationToken?.assetId],
          title: t(labelKeys.title.key, [sourceSymbol, destinationSymbol]),
          subtitle: t(labelKeys.description.key),
          primaryAmount: formatTokenAmount(destinationToken),
          primaryDirection: destinationToken?.direction,
          secondaryAmount: formatTokenAmount(sourceToken),
        };
      }
      // Token in title; source and destination in subtitle; token being wrapped in avatar
      case 'wrap': {
        const { sourceToken, destinationToken } = activity.data;
        const sourceSymbol = sourceToken?.symbol;
        const destinationSymbol = destinationToken?.symbol;
        const subtitle =
          sourceSymbol && destinationSymbol
            ? `${sourceSymbol} → ${destinationSymbol}`
            : t(labelKeys.description.key, [destinationSymbol ?? '']);

        return {
          avatarTokens: [sourceToken?.assetId],
          title: t(labelKeys.title.key, [sourceSymbol ?? '']),
          subtitle,
          primaryAmount: formatTokenAmount(destinationToken),
          primaryDirection: destinationToken?.direction,
          secondaryAmount: formatTokenAmount(sourceToken),
        };
      }
      // Token in title; source and destination in subtitle; destination token in avatar
      case 'convert':
      case 'unwrap': {
        const { sourceToken, destinationToken } = activity.data;
        const sourceSymbol = sourceToken?.symbol;
        const destinationSymbol = destinationToken?.symbol;
        const subtitle =
          sourceSymbol && destinationSymbol
            ? `${sourceSymbol} → ${destinationSymbol}`
            : t(labelKeys.description.key, [destinationSymbol ?? '']);

        return {
          avatarTokens: [destinationToken?.assetId],
          title: t(labelKeys.title.key, [destinationSymbol ?? '']),
          subtitle,
          primaryAmount: formatTokenAmount(destinationToken),
          primaryDirection: destinationToken?.direction,
          secondaryAmount: formatTokenAmount(sourceToken),
        };
      }
      // Token being received in avatar
      case 'lendingWithdrawal': {
        const { sourceToken, destinationToken } = activity.data;
        const symbol = destinationToken?.symbol ?? '';

        return {
          avatarTokens: [destinationToken?.assetId ?? sourceToken?.assetId],
          title: t(labelKeys.title.key, [symbol]),
          subtitle: t(labelKeys.description.key, [symbol]),
          primaryAmount: formatTokenAmount(destinationToken),
          primaryDirection: destinationToken?.direction,
          secondaryAmount: formatTokenAmount(sourceToken),
        };
      }
      // Token in title. API bridge rows may only include the source leg.
      case 'bridge': {
        const { sourceToken, destinationToken } = activity.data;
        const symbol = sourceToken?.symbol ?? destinationToken?.symbol ?? '';

        return {
          avatarTokens: destinationToken
            ? [sourceToken?.assetId, destinationToken?.assetId]
            : [sourceToken?.assetId],
          title: t(labelKeys.title.key, [symbol]),
          primaryAmount: formatTokenAmount(destinationToken ?? sourceToken),
          primaryDirection: (destinationToken ?? sourceToken)?.direction,
          ...(destinationToken
            ? {
                secondaryAmount: formatTokenAmount(sourceToken),
              }
            : { secondaryAmount: formatAsFiat(sourceToken) }),
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
          primaryAmount: formatTokenAmount(token),
          primaryDirection: token?.direction,
          secondaryAmount: formatAsFiat(token),
        };
      }
      case 'perpsAddFunds':
      case 'perpsWithdraw': {
        const { fiat, token } = activity.data;
        const fiatAmount = fiat ? Number(fiat.amount) : undefined;
        const signedFiatAmount =
          activity.type === 'perpsWithdraw' && fiatAmount !== undefined
            ? -fiatAmount
            : fiatAmount;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key),
          subtitle: t('perpsBalance'),
          primaryAmount:
            signedFiatAmount !== undefined && Number.isFinite(signedFiatAmount)
              ? formatCurrencyWithMinThreshold(signedFiatAmount, PERPS_CURRENCY)
              : undefined,
          primaryDirection:
            activity.type === 'perpsAddFunds' ? 'in' : undefined,
        };
      }
      case 'nftBuy':
      case 'nftSell': {
        const { token, paymentToken } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key, [token?.symbol ?? 'NFT']),
          primaryAmount: formatTokenAmount(paymentToken),
          primaryDirection: paymentToken?.direction,
          secondaryAmount: formatAsFiat(paymentToken),
        };
      }
      case 'nftMint': {
        const { token } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key, [token?.symbol ?? 'NFT']),
          primaryAmount: formatTokenAmount(token),
          primaryDirection: token?.direction,
          secondaryAmount: formatAsFiat(token),
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
          primaryAmount: formatTokenAmount(token),
          primaryDirection: token?.direction,
          secondaryAmount: formatAsFiat(token),
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
          primaryAmount: token?.amount
            ? formatTokenAmount(token, { showPlus: false })
            : undefined,
          primaryDirection: token?.direction,
          secondaryAmount: token?.amount
            ? formatAsFiat(token, { showPlus: false })
            : undefined,
        };
      }
      // Token being lent in avatar
      case 'lendingDeposit': {
        const { sourceToken, destinationToken } = activity.data;
        const primaryToken = destinationToken ?? sourceToken;
        const secondaryToken = destinationToken ? sourceToken : undefined;

        return {
          avatarTokens: [secondaryToken?.assetId],
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
          primaryAmount: formatTokenAmount(primaryToken),
          primaryDirection: primaryToken?.direction,
          secondaryAmount: formatTokenAmount(secondaryToken),
        };
      }
      case 'claimMusdBonus': {
        const { token } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key),
          subtitle: t(labelKeys.description.key),
          primaryAmount: formatTokenAmount(token),
          primaryDirection: token?.direction,
          secondaryAmount: formatAsFiat(token),
        };
      }
      case 'assetDeactivation':
      case 'assetActivation': {
        const { token } = activity.data;

        return {
          avatarTokens: [token?.assetId],
          title: t(labelKeys.title.key, [token?.symbol ?? '']),
          subtitle: t(labelKeys.description.key, [token?.symbol ?? '']),
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
  const { primaryAmount, primaryDirection, secondaryAmount, avatarTokens } =
    content;

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
      <span className={cn(primaryDirection === 'in' && 'text-success-default')}>
        {primaryAmount}
      </span>
    ),
    secondaryAmount,
  };
}
