import type { CaipChainId, Hex } from '@metamask/utils';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../shared/constants/network';
import { NATIVE_TOKEN_ADDRESS } from '../../../shared/constants/transaction';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../shared/lib/activity/types';
import { getAssetImageUrl } from '../../../shared/lib/asset-utils';
import type {
  ActivityListItemAvatarConfig,
  ResolvedActivityToken,
} from '../../components/app/activity-list-item-avatar';

type ActivityAvatarContext = {
  chainIdForImage: CaipChainId;
  hexChainId: string;
  networkName: string;
};

const getNativeCurrencySymbol = (hexChainId: string) =>
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
    hexChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
  ];

const isNativeAssetId = (assetId: string) =>
  assetId.includes('/slip44:') || assetId.includes('/native:');

const isNativeToken = (token: TokenAmount, hexChainId: string) => {
  if (token.assetId && isNativeAssetId(token.assetId)) {
    return true;
  }

  const nativeSymbol = getNativeCurrencySymbol(hexChainId);
  if (!token.symbol) {
    return true;
  }
  return Boolean(nativeSymbol && token.symbol === nativeSymbol);
};

const isCrossTokenTransaction = (
  item: ActivityListItem,
  primaryToken?: TokenAmount,
  secondaryToken?: TokenAmount,
) => {
  if (!primaryToken?.symbol || !secondaryToken?.symbol) {
    return false;
  }

  if (primaryToken.symbol === secondaryToken.symbol) {
    return false;
  }

  return item.type === 'swap';
};

const getTokenImageUrl = (
  token: TokenAmount,
  isNative: boolean,
  chainIdForImage: CaipChainId,
) => {
  if (token.assetId) {
    return getAssetImageUrl(token.assetId, chainIdForImage);
  }

  if (isNative) {
    return getAssetImageUrl(NATIVE_TOKEN_ADDRESS, chainIdForImage);
  }

  return undefined;
};

const getToken = (
  token: TokenAmount,
  { chainIdForImage, hexChainId, networkName }: ActivityAvatarContext,
): ResolvedActivityToken => {
  const nativeSymbol = getNativeCurrencySymbol(hexChainId);
  const isNative = isNativeToken(token, hexChainId);
  const symbol = token.symbol ?? nativeSymbol ?? networkName;

  return {
    symbol,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: hexChainId as Hex,
    fallbackName: symbol,
    imageUrl: getTokenImageUrl(token, isNative, chainIdForImage),
  };
};

/**
 * Resolves avatar config for an activity list item (single vs dual token).
 * Dual is used for cross-token swap (and in future, bridge, and convert activities).
 *
 * @param item - Activity list item.
 * @param primaryToken - Primary token amount.
 * @param secondaryToken - Secondary token amount.
 * @param context - Activity avatar context.
 * @returns Activity list item avatar config.
 */
export const getActivityListItemAvatarConfig = (
  item: ActivityListItem,
  primaryToken: TokenAmount | undefined,
  secondaryToken: TokenAmount | undefined,
  context: ActivityAvatarContext,
): ActivityListItemAvatarConfig => {
  const nativeSymbol = getNativeCurrencySymbol(context.hexChainId);
  const fallbackToken = getToken(
    { direction: 'in', symbol: nativeSymbol ?? context.networkName },
    context,
  );

  if (
    isCrossTokenTransaction(item, primaryToken, secondaryToken) &&
    secondaryToken &&
    primaryToken
  ) {
    return {
      variant: 'dual',
      from: getToken(secondaryToken, context),
      to: getToken(primaryToken, context),
    };
  }

  const singleToken = primaryToken ?? secondaryToken;

  return {
    variant: 'single',
    token: singleToken ? getToken(singleToken, context) : fallbackToken,
  };
};
