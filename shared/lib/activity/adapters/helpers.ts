import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { CaipChainId } from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import type { Hex } from 'viem';
import {
  BRIDGE_CHAINID_COMMON_TOKEN_PAIR,
  BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN,
} from '../../../constants/bridge';
import { CHAIN_IDS } from '../../../constants/network';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../constants/tokens';
import { toAssetId } from '../../asset-utils';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../string-utils';
import type { TransactionGroup } from '../../multichain/types';
import type { ActivityFee, TokenAmount } from '../types';

type ValueTransfer = NonNullable<
  V1TransactionByHashResponse['valueTransfers']
>[number];

function isNftStandard(value?: string) {
  return value === 'erc721' || value === 'erc1155';
}

function getNativeAssetSafe(chainId: string | number) {
  try {
    return getNativeAssetForChainId(chainId);
  } catch {
    return undefined;
  }
}

const nativeTokenDecimals = 18;

function toNetworkFeeAmount(
  gasUsed: string | number | undefined,
  gasPrice: string | number | undefined,
): string | undefined {
  if (gasUsed === undefined || gasPrice === undefined) {
    return undefined;
  }

  try {
    return String(BigInt(gasUsed) * BigInt(gasPrice));
  } catch {
    return undefined;
  }
}

function buildBaseNetworkFee(
  amount: string,
  chainId: string | number,
): ActivityFee {
  const nativeAsset = getNativeAssetSafe(chainId);

  return {
    type: 'base',
    amount,
    ...(nativeAsset?.decimals === undefined
      ? { decimals: nativeTokenDecimals }
      : { decimals: nativeAsset.decimals }),
    ...(nativeAsset?.symbol ? { symbol: nativeAsset.symbol } : {}),
    ...(nativeAsset?.assetId ? { assetId: nativeAsset.assetId } : {}),
  };
}

export function getLocalTransactionFees(
  transactionGroup: Pick<TransactionGroup, 'primaryTransaction'>,
): ActivityFee[] | undefined {
  const { primaryTransaction } = transactionGroup;
  const amount = toNetworkFeeAmount(
    primaryTransaction.txReceipt?.gasUsed,
    primaryTransaction.txReceipt?.effectiveGasPrice ??
      primaryTransaction.txParams?.gasPrice,
  );

  return amount
    ? [buildBaseNetworkFee(amount, primaryTransaction.chainId)]
    : undefined;
}

function getKnownTokenMetadata(
  chainId: CaipChainId | Hex,
  contractAddress?: string,
) {
  if (contractAddress === undefined) {
    return undefined;
  }

  const assetId = toAssetId(contractAddress, chainId);
  const tokenMetadata =
    (chainId === CHAIN_IDS.MAINNET || assetId?.startsWith('eip155:1/')
      ? STATIC_MAINNET_TOKEN_LIST[contractAddress.toLowerCase()]
      : undefined) ??
    [
      ...Object.values(BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN),
      ...Object.values(BRIDGE_CHAINID_COMMON_TOKEN_PAIR),
    ].find((token) => token?.assetId === assetId);

  return tokenMetadata
    ? { ...tokenMetadata, ...(assetId ? { assetId } : {}) }
    : undefined;
}

export function getTokenMetadataFromKnownToken(
  contractAddress: string | undefined,
  direction: TokenAmount['direction'],
  chainId: CaipChainId | Hex,
) {
  const tokenMetadata = getKnownTokenMetadata(chainId, contractAddress);

  if (!tokenMetadata) {
    return undefined;
  }

  return {
    direction,
    ...(tokenMetadata.symbol ? { symbol: tokenMetadata.symbol } : {}),
    ...(tokenMetadata.decimals === undefined
      ? {}
      : { decimals: tokenMetadata.decimals }),
    ...(tokenMetadata.assetId ? { assetId: tokenMetadata.assetId } : {}),
  };
}

export function parseValueTransfers(
  valueTransfers: ValueTransfer[] | undefined,
  subjectAddress: string,
): {
  sentTransfer: ValueTransfer | undefined;
  receivedTransfer: ValueTransfer | undefined;
  sentNativeTransfer: ValueTransfer | undefined;
  sentNftTransfer: ValueTransfer | undefined;
  receivedNftTransfer: ValueTransfer | undefined;
} {
  const sent = valueTransfers?.filter(({ from }) =>
    equalsIgnoreCase(from, subjectAddress),
  );
  const received = valueTransfers?.filter(({ to }) =>
    equalsIgnoreCase(to, subjectAddress),
  );

  const sentTransfer = sent?.[0];

  const receivedTransfer =
    received?.find(({ symbol }) => symbol !== sentTransfer?.symbol) ??
    received?.[0];

  const sentNativeTransfer = sent?.find(
    ({ transferType }) => transferType === 'normal',
  );

  const sentNftTransfer = sent?.find(({ transferType }) =>
    isNftStandard(transferType),
  );
  const receivedNftTransfer = received?.find(({ transferType }) =>
    isNftStandard(transferType),
  );

  return {
    sentTransfer,
    receivedTransfer,
    sentNativeTransfer,
    sentNftTransfer,
    receivedNftTransfer,
  };
}
