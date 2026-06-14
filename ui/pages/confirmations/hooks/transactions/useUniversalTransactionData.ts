import { BigNumber } from 'bignumber.js';
import type { Json } from '@metamask/utils';
import type { PendingMultichainTransaction } from '@metamask/multichain-transactions-controller';
import { useSelector } from 'react-redux';

import {
  MULTICHAIN_NETWORK_TO_ASSET_TYPES,
  MultichainNativeAssets,
} from '../../../../../shared/constants/multichain/assets';
import {
  BITCOIN_SIGNET_TOKEN_IMAGE_URL,
  BITCOIN_TESTNET_TOKEN_IMAGE_URL,
  BITCOIN_TOKEN_IMAGE_URL,
  MULTICHAIN_NETWORK_TO_NICKNAME,
  SOLANA_DEVNET_IMAGE_URL,
  SOLANA_TESTNET_IMAGE_URL,
  SOLANA_TOKEN_IMAGE_URL,
  TRON_NILE_TOKEN_IMAGE_URL,
  TRON_SHASTA_TOKEN_IMAGE_URL,
  TRON_TOKEN_IMAGE_URL,
} from '../../../../../shared/constants/multichain/networks';
import { calcTokenAmount } from '../../../../../shared/lib/transactions-controller-utils';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { getAssetsMetadata, getAssetsRates } from '../../../../selectors/assets';
import { formatAmount } from '../../components/simulation-details/formatAmount';
import { useConfirmationId } from '../useConfirmationId';

type AssetDisplayMetadata = {
  assetId: string;
  symbol: string;
  decimals: number;
  imageUrl?: string;
};

export type UniversalTransactionData = {
  approvalId: string;
  chainNamespace: string;
  chain: string;
  chainId: string;
  networkLabel: string;
  networkImageUrl?: string;
  accountId: string;
  from: string;
  to: string;
  amount: string;
  assetId: string;
  assetSymbol: string;
  assetDecimals: number;
  assetImageUrl?: string;
  feeAmount?: string;
  feeAssetId?: string;
  feeAssetSymbol?: string;
  feeAssetDecimals?: number;
  feeAssetImageUrl?: string;
  custom?: Record<string, Json>;
  origin: string;
  formattedAmount: string;
  formattedFee?: string;
  formattedFeeFiat?: string;
};

function selectPendingUniversalTransactionById(
  state: {
    metamask: {
      pendingTransactions?: Record<string, PendingMultichainTransaction>;
    };
  },
  id: string | undefined,
): PendingMultichainTransaction | undefined {
  return id ? state.metamask.pendingTransactions?.[id] : undefined;
}

function selectInternalAccountAddressById(
  state: { metamask: { internalAccounts?: { accounts?: Record<string, { address: string }> } } },
  accountId: string | undefined,
): string | undefined {
  return accountId
    ? state.metamask.internalAccounts?.accounts?.[accountId]?.address
    : undefined;
}

const NATIVE_ASSET_METADATA_BY_ASSET_ID: Record<string, AssetDisplayMetadata> = {
  [MultichainNativeAssets.BITCOIN]: {
    assetId: MultichainNativeAssets.BITCOIN,
    symbol: 'BTC',
    decimals: 8,
    imageUrl: BITCOIN_TOKEN_IMAGE_URL,
  },
  [MultichainNativeAssets.BITCOIN_TESTNET]: {
    assetId: MultichainNativeAssets.BITCOIN_TESTNET,
    symbol: 'tBTC',
    decimals: 8,
    imageUrl: BITCOIN_TESTNET_TOKEN_IMAGE_URL,
  },
  [MultichainNativeAssets.BITCOIN_SIGNET]: {
    assetId: MultichainNativeAssets.BITCOIN_SIGNET,
    symbol: 'sBTC',
    decimals: 8,
    imageUrl: BITCOIN_SIGNET_TOKEN_IMAGE_URL,
  },
  [MultichainNativeAssets.SOLANA]: {
    assetId: MultichainNativeAssets.SOLANA,
    symbol: 'SOL',
    decimals: 9,
    imageUrl: SOLANA_TOKEN_IMAGE_URL,
  },
  [MultichainNativeAssets.SOLANA_DEVNET]: {
    assetId: MultichainNativeAssets.SOLANA_DEVNET,
    symbol: 'SOL',
    decimals: 9,
    imageUrl: SOLANA_DEVNET_IMAGE_URL,
  },
  [MultichainNativeAssets.SOLANA_TESTNET]: {
    assetId: MultichainNativeAssets.SOLANA_TESTNET,
    symbol: 'SOL',
    decimals: 9,
    imageUrl: SOLANA_TESTNET_IMAGE_URL,
  },
  [MultichainNativeAssets.TRON]: {
    assetId: MultichainNativeAssets.TRON,
    symbol: 'TRX',
    decimals: 6,
    imageUrl: TRON_TOKEN_IMAGE_URL,
  },
  [MultichainNativeAssets.TRON_NILE]: {
    assetId: MultichainNativeAssets.TRON_NILE,
    symbol: 'TRX',
    decimals: 6,
    imageUrl: TRON_NILE_TOKEN_IMAGE_URL,
  },
  [MultichainNativeAssets.TRON_SHASTA]: {
    assetId: MultichainNativeAssets.TRON_SHASTA,
    symbol: 'TRX',
    decimals: 6,
    imageUrl: TRON_SHASTA_TOKEN_IMAGE_URL,
  },
};

function getChainNamespace(chainId: string): string {
  return chainId.split(':')[0] ?? '';
}

function getNativeAssetId(chainId: string): string | undefined {
  return MULTICHAIN_NETWORK_TO_ASSET_TYPES[
    chainId as keyof typeof MULTICHAIN_NETWORK_TO_ASSET_TYPES
  ]?.[0];
}

export function useUniversalTransactionDataOptional():
  | UniversalTransactionData
  | undefined {
  const confirmationId = useConfirmationId();
  const locale = useSelector(getIntlLocale);
  const assetRates = useSelector(getAssetsRates);
  const assetsMetadata = useSelector(getAssetsMetadata);
  const fiatFormatter = useFiatFormatter();
  const pendingTx = useSelector((state) =>
    selectPendingUniversalTransactionById(
      state as Parameters<typeof selectPendingUniversalTransactionById>[0],
      confirmationId,
    ),
  );
  const from = useSelector((state) =>
    selectInternalAccountAddressById(
      state as Parameters<typeof selectInternalAccountAddressById>[0],
      pendingTx?.accountId,
    ),
  );

  if (!pendingTx || !from) {
    return undefined;
  }

  const chainNamespace = getChainNamespace(pendingTx.chainId);
  const nativeAssetId = getNativeAssetId(pendingTx.chainId);
  const assetId = pendingTx.assetId ?? nativeAssetId;
  const feeAssetId = pendingTx.fee?.assetId ?? nativeAssetId;

  const getAssetMetadata = (
    targetAssetId: string | undefined,
  ): AssetDisplayMetadata | undefined => {
    if (!targetAssetId) {
      return undefined;
    }

    const metadata = assetsMetadata[targetAssetId];
    const nativeMetadata = NATIVE_ASSET_METADATA_BY_ASSET_ID[targetAssetId];
    const unit = metadata?.units?.[0];

    return {
      assetId: targetAssetId,
      symbol: metadata?.symbol ?? nativeMetadata?.symbol ?? targetAssetId,
      decimals: unit?.decimals ?? nativeMetadata?.decimals ?? 0,
      imageUrl: metadata?.iconUrl ?? nativeMetadata?.imageUrl,
    };
  };

  const assetMetadata = getAssetMetadata(assetId);
  const feeAssetMetadata = getAssetMetadata(feeAssetId);
  const nativeAssetMetadata = getAssetMetadata(nativeAssetId);

  if (!assetMetadata) {
    return undefined;
  }

  const formattedAmount = formatAmount(
    locale,
    calcTokenAmount(pendingTx.amount, assetMetadata.decimals),
  );

  const feeAmount =
    pendingTx.fee?.amount && feeAssetMetadata
      ? calcTokenAmount(pendingTx.fee.amount, feeAssetMetadata.decimals)
      : undefined;

  const formattedFee = feeAmount ? formatAmount(locale, feeAmount) : undefined;

  const conversionRate =
    feeAssetId && assetRates?.[feeAssetId]?.rate
      ? assetRates[feeAssetId].rate
      : undefined;

  const fiatValue =
    feeAmount && conversionRate
      ? new BigNumber(conversionRate).times(feeAmount).toNumber()
      : undefined;

  let formattedFeeFiat: string | undefined;
  if (fiatValue !== undefined) {
    const fiatBn = new BigNumber(fiatValue);
    if (fiatBn.eq(0)) {
      formattedFeeFiat = undefined;
    } else if (fiatBn.lt(new BigNumber(0.01))) {
      formattedFeeFiat = `< ${fiatFormatter(0.01)}`;
    } else {
      formattedFeeFiat = fiatFormatter(fiatBn.toNumber());
    }
  }

  return {
    approvalId: pendingTx.approvalId,
    chainNamespace,
    chain: pendingTx.chainId,
    chainId: pendingTx.chainId,
    networkLabel:
      MULTICHAIN_NETWORK_TO_NICKNAME[
        pendingTx.chainId as keyof typeof MULTICHAIN_NETWORK_TO_NICKNAME
      ] ?? pendingTx.chainId,
    networkImageUrl: nativeAssetMetadata?.imageUrl,
    accountId: pendingTx.accountId,
    from,
    to: pendingTx.to,
    amount: pendingTx.amount,
    assetId: assetMetadata.assetId,
    assetSymbol: assetMetadata.symbol,
    assetDecimals: assetMetadata.decimals,
    assetImageUrl: assetMetadata.imageUrl,
    feeAmount: pendingTx.fee?.amount,
    feeAssetId: feeAssetMetadata?.assetId,
    feeAssetSymbol: feeAssetMetadata?.symbol,
    feeAssetDecimals: feeAssetMetadata?.decimals,
    feeAssetImageUrl: feeAssetMetadata?.imageUrl,
    custom: pendingTx.custom,
    origin: pendingTx.origin,
    formattedAmount,
    formattedFee,
    formattedFeeFiat,
  };
}
